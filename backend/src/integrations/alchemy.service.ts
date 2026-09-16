import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface AlchemyToken {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  balance: string;
}

interface AlchemyAssetResponse {
  ownedNfts: any[];
  ownedTokens: AlchemyToken[];
  totalCount: number;
  blockHash: string;
}

// Common token contracts and their metadata
const KNOWN_TOKENS: { [key: string]: { symbol: string; name: string; decimals: number } } = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', name: 'Tether', decimals: 6 },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  '0xc02aaa39b223fe8d0a0e8e4f27ead9083c756cc2': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  '0x2260fac5e5542a773aa44fbcff022053d649e78f': { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  '0x514910771af9ca656af840dff83e8264ecf986ca': { symbol: 'LINK', name: 'ChainLink Token', decimals: 18 },
  '0x7fc66500c84a76ad7e9c93437e434122a1f9adf5': { symbol: 'AAVE', name: 'Aave Token', decimals: 18 },
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  '0x0000000000085d4780b73119b8b580991dee8d52': { symbol: 'GUSD', name: 'Gemini Dollar', decimals: 2 },
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': { symbol: 'SUSHI', name: 'SushiToken', decimals: 18 },
};

@Injectable()
export class AlchemyService {
  private readonly apiKey = process.env.ALCHEMY_API_KEY || '';
  private readonly baseUrl = 'https://eth-mainnet.g.alchemy.com/v2';

  /**
   * Get all token balances for a wallet using Alchemy
   * Fetches balances and metadata in one call
   */
  async getTokenBalances(walletAddress: string, chain: string = 'ethereum'): Promise<AlchemyToken[]> {
    try {
      if (!this.apiKey) {
        console.error('❌ Alchemy API key not configured');
        return [];
      }

      console.log(`📡 Fetching tokens for ${walletAddress} from Alchemy...`);

      const url = `${this.baseUrl}/${this.apiKey}`;

      // Use getTokenBalances with contractMetadata to get symbol, name, decimals
      const response = await axios.post(url, {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [walletAddress, 'erc20'],
        id: 1,
      }, {
        timeout: 15000,
      });

      if (response.data.error) {
        console.error(`❌ Alchemy API error: ${response.data.error.message}`);
        return [];
      }

      if (!response.data.result || !response.data.result.tokenBalances) {
        console.log(`⚠️  No tokens found for ${walletAddress}`);
        return [];
      }

      const tokenBalances = response.data.result.tokenBalances;
      console.log(`✅ Found ${tokenBalances.length} token balances`);

      if (tokenBalances.length === 0) {
        return [];
      }

      // Fetch metadata for each token contract address
      const result: AlchemyToken[] = [];

      for (const token of tokenBalances) {
        const balance = BigInt(token.tokenBalance || '0');
        if (balance > 0n) {
          // Try to fetch token metadata
          const metadata = await this.getTokenMetadata(token.contractAddress);

          result.push({
            contractAddress: token.contractAddress,
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            decimals: metadata.decimals || 18,
            logo: '',
            balance: token.tokenBalance,
          });
        }
      }

      console.log(`✅ Returning ${result.length} tokens with metadata`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching tokens from Alchemy:', error);
      return [];
    }
  }

  /**
   * Get token metadata (symbol, name, decimals)
   * Falls back to known tokens database if Alchemy doesn't return metadata
   */
  private async getTokenMetadata(contractAddress: string): Promise<{
    symbol?: string;
    name?: string;
    decimals?: number;
  }> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}`;

      const response = await axios.post(url, {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenMetadata',
        params: [contractAddress],
        id: 1,
      }, {
        timeout: 10000,
      });

      if (response.data.result && (response.data.result.symbol || response.data.result.name)) {
        return {
          symbol: response.data.result.symbol,
          name: response.data.result.name,
          decimals: response.data.result.decimals,
        };
      }

      // Fallback to known tokens database
      const normalizedAddress = contractAddress.toLowerCase();
      if (KNOWN_TOKENS[normalizedAddress]) {
        console.log(`📚 Using known token: ${KNOWN_TOKENS[normalizedAddress].symbol}`);
        return KNOWN_TOKENS[normalizedAddress];
      }

      return {};
    } catch (error) {
      console.warn(`⚠️  Could not fetch metadata for ${contractAddress}`);

      // Fallback to known tokens database on error
      const normalizedAddress = contractAddress.toLowerCase();
      if (KNOWN_TOKENS[normalizedAddress]) {
        return KNOWN_TOKENS[normalizedAddress];
      }

      return {};
    }
  }

  /**
   * Get ETH balance for wallet
   */
  async getEthBalance(walletAddress: string): Promise<{ balance: string; symbol: string }> {
    try {
      if (!this.apiKey) {
        console.error('Alchemy API key not configured');
        return { balance: '0', symbol: 'ETH' };
      }

      const url = `${this.baseUrl}/${this.apiKey}`;

      const response = await axios.post(url, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
        id: 1,
      }, {
        timeout: 10000,
      });

      if (response.data.result) {
        // Convert hex to decimal
        const balanceWei = BigInt(response.data.result);
        return {
          balance: balanceWei.toString(),
          symbol: 'ETH',
        };
      }

      return { balance: '0', symbol: 'ETH' };
    } catch (error) {
      console.error('Error fetching ETH balance from Alchemy:', error);
      return { balance: '0', symbol: 'ETH' };
    }
  }

  /**
   * Parse decimal value
   */
  parseDecimal(value: string, decimals: number): number {
    try {
      const bigValue = BigInt(value || '0');
      const divisor = BigInt(10 ** decimals);
      return Number(bigValue) / Number(divisor);
    } catch (e) {
      console.error(`Error parsing decimal: ${value}`, e);
      return 0;
    }
  }
}
