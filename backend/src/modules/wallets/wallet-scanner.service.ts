import { Injectable, Inject } from '@nestjs/common';
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
   */
  async scanWalletBalance(
    address: string,
    chain: string,
  ): Promise<TokenBalance[]> {
    try {
      const balances: TokenBalance[] = [];

      // Get native coin (ETH/MATIC) balance
      const ethBalance = await this.etherscanService.getEthBalance(address, chain);
      const ethDecimals = chain.toLowerCase() === 'polygon' ? 18 : 18;
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

      // Get all token balances from Alchemy (much faster and more reliable than Etherscan)
      const alchemyTokens = await this.alchemyService.getTokenBalances(address);

      // Convert Alchemy tokens to TokenBalance format
      const tokenMap = new Map<string, TokenBalance>();

      for (const token of alchemyTokens) {
        const parsedAmount = this.alchemyService.parseDecimal(token.balance, token.decimals);

        tokenMap.set(token.contractAddress.toLowerCase(), {
          symbol: token.symbol || 'UNKNOWN',
          name: token.name || 'Unknown',
          address: token.contractAddress,
          amount: parsedAmount.toString(),
          decimals: token.decimals,
          value: 0,
        });
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
