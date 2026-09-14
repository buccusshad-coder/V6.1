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
   * This is much faster and more reliable than Etherscan
   */
  async getTokenBalances(walletAddress: string, chain: string = 'ethereum'): Promise<AlchemyToken[]> {
    try {
      if (!this.apiKey) {
        console.error('Alchemy API key not configured');
        return [];
      }

      const url = `${this.baseUrl}/${this.apiKey}/getOwnedTokens`;

      const response = await axios.post(url, {
        address: walletAddress,
        withMetadata: true,
      }, {
        timeout: 10000,
      });

      if (!response.data.ownedTokens || !Array.isArray(response.data.ownedTokens)) {
        console.log(`No tokens found for ${walletAddress}`);
        return [];
      }

      console.log(`Found ${response.data.ownedTokens.length} tokens for ${walletAddress}`);

      // Filter out tokens with zero balance
      return response.data.ownedTokens.filter((token: AlchemyToken) => {
        const balance = BigInt(token.balance || '0');
        return balance > 0n;
      });
    } catch (error) {
      console.error('Error fetching tokens from Alchemy:', error);
      return [];
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
