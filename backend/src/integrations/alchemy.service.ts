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

      if (response.data.result) {
        return {
          symbol: response.data.result.symbol,
          name: response.data.result.name,
          decimals: response.data.result.decimals,
        };
      }

      return {};
    } catch (error) {
      console.warn(`⚠️  Could not fetch metadata for ${contractAddress}`);
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
