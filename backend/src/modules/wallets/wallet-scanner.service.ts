import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import { EtherscanService } from '../../integrations/etherscan.service';
import { AlchemyService } from '../../integrations/alchemy.service';
import { PricesService } from '../prices/prices.service';

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  amount: string;
  decimals: number;
  value: number;
}

interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  type: 'transfer' | 'swap' | 'bridge' | 'stake' | 'mint' | 'burn';
  token: string;
  amount: string;
  timestamp: number;
  blockNumber: number;
  gasPrice: string;
  gasUsed: string;
  value: number;
}

@Injectable()
export class WalletScannerService {
  constructor(
    private readonly etherscanService: EtherscanService,
    private readonly alchemyService: AlchemyService,
    private readonly pricesService: PricesService,
  ) {}

  /**
   * Scan wallet for all token balances including native coin
   * Uses Alchemy for Ethereum, Helius for Solana
   */
  async scanWalletBalance(
    address: string,
    chain: string,
  ): Promise<TokenBalance[]> {
    try {
      if (chain.toLowerCase() === 'solana') {
        console.log(`🔍 Scanning Solana wallet ${address}`);
        return await this.scanSolanaWallet(address);
      }

      if (chain.toLowerCase() === 'ethereum') {
        console.log(`🔍 Scanning wallet ${address} on ${chain}`);

        // Try Alchemy first for Ethereum
        const alchemyTokens = await this.alchemyService.getTokenBalances(address, chain);
        if (alchemyTokens && alchemyTokens.length > 0) {
          console.log(`✅ Alchemy returned ${alchemyTokens.length} tokens`);
          return await this.formatTokenBalances(address, chain, alchemyTokens, 'alchemy');
        }

        console.warn(`⚠️  Alchemy returned no tokens, falling back to Etherscan`);
      }

      // Fallback to Etherscan
      console.log(`📡 Using Etherscan for ${address}`);
      const balances: TokenBalance[] = [];

      // Get native coin (ETH/MATIC) balance
      const ethBalance = await this.etherscanService.getEthBalance(address, chain);
      const ethDecimals = 18;
      const parsedEthBalance = this.etherscanService.parseDecimal(ethBalance.balance, ethDecimals);

      // Get current native coin price
      const symbolMap = { ethereum: 'ETH', polygon: 'MATIC' };
      const symbol = symbolMap[chain.toLowerCase()] || 'ETH';
      let nativePrice = 0;
      try {
        const priceData = await this.pricesService.getLatestPrice(symbol);
        nativePrice = parseFloat(priceData.current_price) || 0;
      } catch (e) {
        console.warn(`Could not fetch price for ${symbol}`);
      }

      if (parsedEthBalance > 0) {
        balances.push({
          symbol: ethBalance.symbol,
          name: ethBalance.symbol === 'ETH' ? 'Ethereum' : 'Matic',
          address: '0x0000000000000000000000000000000000000000',
          amount: parsedEthBalance.toString(),
          decimals: ethDecimals,
          value: parsedEthBalance * nativePrice,
        });
      }

      // Get all token transfers to calculate balances
      const tokenTransfers = await this.etherscanService.getTokenTransfers(address, chain);

      // Group by token and calculate net balance
      const tokenMap = new Map<string, TokenBalance>();

      for (const tx of tokenTransfers) {
        const key = tx.contractAddress.toLowerCase();
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        const amount = this.etherscanService.parseDecimal(tx.value, parseInt(tx.tokenDecimal));

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            symbol: tx.tokenSymbol,
            name: tx.tokenName,
            address: tx.contractAddress,
            amount: '0',
            decimals: parseInt(tx.tokenDecimal),
            value: 0,
          });
        }

        const token = tokenMap.get(key)!;
        const currentAmount = parseFloat(token.amount);
        token.amount = (
          isIncoming
            ? currentAmount + amount
            : currentAmount - amount
        ).toString();
      }

      // Get prices and calculate values
      for (const [, token] of tokenMap) {
        if (parseFloat(token.amount) > 0) {
          try {
            const priceData = await this.pricesService.getLatestPrice(token.symbol);
            token.value = parseFloat(token.amount) * parseFloat(priceData.current_price);
          } catch (e) {
            console.warn(`Could not fetch price for ${token.symbol}`);
            token.value = 0;
          }
          balances.push(token);
        }
      }

      return balances;
    } catch (error) {
      console.error(`Failed to scan wallet ${address}:`, error);
      return [];
    }
  }

  /**
   * Format Alchemy tokens to TokenBalance format with pricing
   */
  private async formatTokenBalances(
    address: string,
    chain: string,
    alchemyTokens: any[],
    source: 'alchemy' | 'etherscan',
  ): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];

    // Get native coin balance
    const ethBalance = await this.alchemyService.getEthBalance(address);
    const parsedEthBalance = this.alchemyService.parseDecimal(ethBalance.balance, 18);

    let nativePrice = 0;
    try {
      const priceData = await this.pricesService.getLatestPrice('ethereum');
      nativePrice = parseFloat(priceData.current_price) || 0;
      console.log(`💰 ETH price: $${nativePrice}`);
    } catch (e) {
      console.warn(`Could not fetch ETH price`);
    }

    if (parsedEthBalance > 0) {
      balances.push({
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x0000000000000000000000000000000000000000',
        amount: parsedEthBalance.toString(),
        decimals: 18,
        value: parsedEthBalance * nativePrice,
      });
    }

    // Process tokens - fetch prices in parallel for speed
    const pricePromises = alchemyTokens
      .filter(token => this.alchemyService.parseDecimal(token.balance, token.decimals) > 0)
      .map(async (token) => {
        const parsedBalance = this.alchemyService.parseDecimal(token.balance, token.decimals);
        let tokenPrice = 0;
        try {
          const priceData = await this.pricesService.getPriceByAddress(token.contractAddress, chain);
          tokenPrice = parseFloat(priceData.current_price) || parseFloat(priceData.price) || 0;
        } catch (e) {
          // Silently continue, price defaults to 0
        }
        return {
          symbol: token.symbol,
          name: token.name,
          address: token.contractAddress,
          amount: parsedBalance.toString(),
          decimals: token.decimals,
          value: parsedBalance * tokenPrice,
        };
      });

    balances.push(...(await Promise.all(pricePromises)));

    console.log(`✅ Formatted ${balances.length} balances from ${source}`);
    return balances;
  }

  /**
   * Get transaction history for a specific token
   */
  async getTokenTransactionHistory(
    walletAddress: string,
    tokenAddress: string,
    chain: string,
  ): Promise<TokenTransaction[]> {
    try {
      const tokenTransfers = await this.etherscanService.getTokenTransfers(walletAddress, chain);

      const filtered = tokenTransfers
        .filter(tx => tx.contractAddress.toLowerCase() === tokenAddress.toLowerCase())
        .map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          type: 'transfer' as const,
          token: tx.contractAddress,
          amount: this.etherscanService.parseDecimal(tx.value, parseInt(tx.tokenDecimal)).toString(),
          timestamp: parseInt(tx.timeStamp) * 1000,
          blockNumber: parseInt(tx.blockNumber),
          gasPrice: tx.gasPrice,
          gasUsed: tx.gasUsed,
          value: 0, // Would need price history to calculate
        }));

      return filtered;
    } catch (error) {
      console.error(`Failed to fetch transaction history:`, error);
      return [];
    }
  }

  /**
   * Scan Solana wallet for token balances using Helius API
   */
  private async scanSolanaWallet(walletAddress: string): Promise<TokenBalance[]> {
    try {
      const balances: TokenBalance[] = [];

      // Get SOL balance
      const solResponse = await axios.post('https://api.mainnet-beta.solana.com', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [walletAddress],
      }, { timeout: 10000 });

      const solBalance = (solResponse.data.result?.value || 0) / 1e9;
      let solPrice = 0;
      try {
        const priceData = await this.pricesService.getLatestPrice('solana');
        solPrice = parseFloat(priceData.current_price) || 0;
      } catch (e) {
        console.warn('Could not fetch SOL price');
      }
      console.log(`💰 SOL price: $${solPrice}`);

      if (solBalance > 0) {
        balances.push({
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112',
          amount: solBalance.toString(),
          decimals: 9,
          value: solBalance * solPrice,
        });
      }

      // Get token accounts
      const tokensResponse = await axios.post('https://api.mainnet-beta.solana.com', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { programId: 'TokenkegQfeZyiNwAJsyFbPVwwQQYoNDct2xiaKHjLTE' },
          { encoding: 'jsonParsed' },
        ],
      }, { timeout: 10000 });

      const tokenAccounts = tokensResponse.data.result?.value || [];
      console.log(`📊 Found ${tokenAccounts.length} SPL token accounts`);

      // Fetch prices in parallel for speed
      const tokenPromises = tokenAccounts
        .map((account: any) => {
          try {
            const tokenData = account.account.data.parsed?.info;
            if (!tokenData) return null;

            const mint = tokenData.mint;
            const amount = parseFloat(tokenData.tokenAmount?.amount || '0') /
                          Math.pow(10, tokenData.tokenAmount?.decimals || 0);

            if (amount <= 0) return null;

            return this.pricesService
              .getPriceByAddress(mint, 'solana')
              .then((priceData: any) => {
                const tokenPrice = parseFloat(priceData.current_price) || 0;
                return {
                  symbol: tokenData.symbol || 'UNKNOWN',
                  name: tokenData.name || 'Unknown Token',
                  address: mint,
                  amount: amount.toString(),
                  decimals: tokenData.tokenAmount?.decimals || 0,
                  value: amount * tokenPrice,
                };
              })
              .catch(() => ({
                symbol: tokenData.symbol || 'UNKNOWN',
                name: tokenData.name || 'Unknown Token',
                address: mint,
                amount: amount.toString(),
                decimals: tokenData.tokenAmount?.decimals || 0,
                value: 0,
              }));
          } catch (e) {
            console.warn(`Failed to parse token account:`, e.message);
            return null;
          }
        })
        .filter((p: any) => p !== null);

      const tokens = await Promise.all(tokenPromises);
      balances.push(...tokens.filter((t: any) => t !== null));

      console.log(`✅ Found ${balances.length} tokens on Solana`);
      return balances;
    } catch (error) {
      console.error(`Failed to scan Solana wallet:`, error.message);
      return [];
    }
  }

  /**
   * Trace token origin by following transfers backwards
   */
  async traceTokenOrigin(
    walletAddress: string,
    tokenAddress: string,
    chain: string,
    depth: number = 5,
  ): Promise<{
    path: Array<{
      address: string;
      type: string;
      timestamp: number;
      amount: string;
    }>;
    origin: string;
    currentLocation: string;
  }> {
    try {
      const path: Array<{ address: string; type: string; timestamp: number; amount: string }> = [];
      const tokenTransfers = await this.etherscanService.getTokenTransfers(walletAddress, chain);

      const filtered = tokenTransfers
        .filter(tx => tx.contractAddress.toLowerCase() === tokenAddress.toLowerCase())
        .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

      let origin = '';

      for (const tx of filtered.slice(0, depth)) {
        const amount = this.etherscanService.parseDecimal(tx.value, parseInt(tx.tokenDecimal));
        path.push({
          address: tx.from,
          type: 'transfer',
          timestamp: parseInt(tx.timeStamp) * 1000,
          amount: amount.toString(),
        });
        origin = tx.from;
      }

      // Add current location
      if (filtered.length > 0) {
        path.push({
          address: walletAddress,
          type: 'hold',
          timestamp: Date.now(),
          amount: '0',
        });
      }

      return {
        path,
        origin: origin || walletAddress,
        currentLocation: walletAddress,
      };
    } catch (error) {
      console.error(`Failed to trace token origin:`, error);
      return {
        path: [],
        origin: '',
        currentLocation: walletAddress,
      };
    }
  }

  /**
   * Get swap history from transaction patterns
   * Detects swaps by analyzing multi-token interactions
   */
  async getSwapHistory(
    walletAddress: string,
    chain: string,
  ): Promise<
    Array<{
      hash: string;
      fromToken: string;
      toToken: string;
      fromAmount: string;
      toAmount: string;
      dex: string;
      timestamp: number;
      price: number;
    }>
  > {
    try {
      const transfers = await this.etherscanService.getTokenTransfers(walletAddress, chain);
      const swaps: Array<{
        hash: string;
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: string;
        dex: string;
        timestamp: number;
        price: number;
      }> = [];

      // Group by transaction hash to find swaps
      const byHash = new Map<string, any[]>();

      for (const tx of transfers) {
        if (!byHash.has(tx.hash)) {
          byHash.set(tx.hash, []);
        }
        byHash.get(tx.hash)!.push(tx);
      }

      // Detect swaps: outgoing + incoming token in same tx = swap
      for (const [hash, txs] of byHash) {
        const outgoing = txs.find(t => t.from.toLowerCase() === walletAddress.toLowerCase());
        const incoming = txs.find(t => t.to.toLowerCase() === walletAddress.toLowerCase() && t.hash === hash);

        if (outgoing && incoming && outgoing.contractAddress !== incoming.contractAddress) {
          swaps.push({
            hash,
            fromToken: outgoing.tokenSymbol,
            toToken: incoming.tokenSymbol,
            fromAmount: this.etherscanService.parseDecimal(outgoing.value, parseInt(outgoing.tokenDecimal)).toString(),
            toAmount: this.etherscanService.parseDecimal(incoming.value, parseInt(incoming.tokenDecimal)).toString(),
            dex: 'DEX',
            timestamp: parseInt(outgoing.timeStamp) * 1000,
            price: 0,
          });
        }
      }

      return swaps;
    } catch (error) {
      console.error(`Failed to get swap history:`, error);
      return [];
    }
  }

  /**
   * Get bridge history by detecting cross-chain transactions
   */
  async getBridgeHistory(
    walletAddress: string,
  ): Promise<
    Array<{
      hash: string;
      token: string;
      amount: string;
      fromChain: string;
      toChain: string;
      timestamp: number;
      bridge: string;
    }>
  > {
    try {
      // Bridge detection would require checking multiple chains
      // This is a placeholder that would need multi-chain support
      return [];
    } catch (error) {
      console.error(`Failed to get bridge history:`, error);
      return [];
    }
  }
}
