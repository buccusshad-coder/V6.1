import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DefilamaService {
  private readonly API_BASE = 'https://coins.llama.fi';

  /**
   * Get token price from DefiLlama
   * Supports both contract addresses and token identifiers
   */
  async getTokenPrice(contractAddress: string, chain: string = 'ethereum'): Promise<number | null> {
    try {
      // Map our chain names to DefiLlama chain names
      const chainMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon',
        arbitrum: 'arbitrum',
        base: 'base',
        optimism: 'optimism',
        solana: 'solana',
      };

      const defilamaChain = chainMap[chain.toLowerCase()] || 'ethereum';

      // Format: ethereum:0xaddress
      const tokenId = `${defilamaChain}:${contractAddress.toLowerCase()}`;

      const response = await axios.get(
        `${this.API_BASE}/prices/current/${tokenId}`,
        { timeout: 8000 }
      );

      const data = response.data?.coins?.[tokenId];
      if (data?.price && data.price > 0) {
        console.log(`✅ DefiLlama price for ${contractAddress}: $${data.price}`);
        return data.price;
      }

      return null;
    } catch (error) {
      // Silent fail - DefiLlama might not have the token
      return null;
    }
  }

  /**
   * Get prices for multiple tokens at once
   */
  async getMultiplePrices(
    tokens: Array<{ address: string; chain: string }>,
  ): Promise<Record<string, number | null>> {
    try {
      const chainMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon',
        arbitrum: 'arbitrum',
        base: 'base',
        optimism: 'optimism',
        solana: 'solana',
      };

      const tokenIds = tokens
        .map((t) => {
          const chain = chainMap[t.chain.toLowerCase()] || 'ethereum';
          return `${chain}:${t.address.toLowerCase()}`;
        })
        .join(',');

      if (!tokenIds) return {};

      const response = await axios.get(
        `${this.API_BASE}/prices/current/${tokenIds}`,
        { timeout: 15000 }
      );

      const result: Record<string, number | null> = {};
      Object.entries(response.data?.coins || {}).forEach(([key, data]: any) => {
        const [_, address] = key.split(':');
        result[address] = data?.price > 0 ? data.price : null;
      });

      return result;
    } catch (error) {
      console.warn('DefiLlama batch price fetch failed:', error.message);
      return {};
    }
  }
}
