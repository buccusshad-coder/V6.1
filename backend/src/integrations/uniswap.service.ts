import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UniswapService {
  private readonly SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
  private readonly USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC on Ethereum
  private readonly WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH on Ethereum

  /**
   * Get token price from Uniswap V3 pools
   * Queries for pools with USDC and WETH to determine price
   */
  async getTokenPriceFromUniswap(tokenAddress: string): Promise<number | null> {
    try {
      const query = `
        query {
          token(id: "${tokenAddress.toLowerCase()}") {
            id
            symbol
            decimals
            derivedETH
          }
          pools(
            first: 5
            where: { or: [{ token0: "${tokenAddress.toLowerCase()}" }, { token1: "${tokenAddress.toLowerCase()}" }] }
            orderBy: liquidity
            orderDirection: desc
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            liquidity
            sqrtPrice
            tick
          }
        }
      `;

      const response = await axios.post(
        this.SUBGRAPH_URL,
        { query },
        { timeout: 10000 }
      );

      const data = response.data?.data;

      // Use derivedETH if available (Uniswap's calculated ETH price)
      if (data.token?.derivedETH) {
        const ethPrice = await this.getETHPrice();
        const tokenPriceInETH = parseFloat(data.token.derivedETH);
        return tokenPriceInETH * ethPrice;
      }

      // Fall back to pool-based price calculation
      if (data.pools && data.pools.length > 0) {
        const pool = data.pools[0];
        const price = this.calculatePriceFromPool(pool, tokenAddress);
        if (price && price > 0) {
          return price;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to get Uniswap price for ${tokenAddress}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate token price from pool data
   */
  private calculatePriceFromPool(pool: any, tokenAddress: string): number | null {
    try {
      const token0 = pool.token0;
      const token1 = pool.token1;
      const isToken0 = token0.id.toLowerCase() === tokenAddress.toLowerCase();

      // If pool is USDC/Token or Token/USDC, price is direct
      if (token0.id.toLowerCase() === this.USDC || token1.id.toLowerCase() === this.USDC) {
        const sqrtPrice = parseFloat(pool.sqrtPrice);
        // For Uniswap V3: price = (sqrtPrice / 2^96)^2
        const price = Math.pow(sqrtPrice / Math.pow(2, 96), 2);

        if (isToken0) {
          // Token is token0, so price is token0/token1 (USDC is token1)
          const decimalsAdjustment = Math.pow(10, token1.decimals - token0.decimals);
          return price / decimalsAdjustment;
        } else {
          // Token is token1, so price is 1 / (token0/token1)
          const decimalsAdjustment = Math.pow(10, token0.decimals - token1.decimals);
          return decimalsAdjustment / price;
        }
      }

      // If pool is ETH/Token or Token/ETH, convert via ETH price
      if (token0.id.toLowerCase() === this.WETH || token1.id.toLowerCase() === this.WETH) {
        const sqrtPrice = parseFloat(pool.sqrtPrice);
        let ethPerToken = Math.pow(sqrtPrice / Math.pow(2, 96), 2);

        if (!isToken0) {
          ethPerToken = 1 / ethPerToken;
        }

        const decimalsAdjustment = Math.pow(10, token0.decimals - token1.decimals);
        ethPerToken = ethPerToken / decimalsAdjustment;

        // Get ETH price in USD
        const ethPrice = 2400; // Fallback to approximate ETH price
        return ethPerToken * ethPrice;
      }

      return null;
    } catch (error) {
      console.warn('Error calculating pool price:', error.message);
      return null;
    }
  }

  /**
   * Get current ETH price in USD
   */
  private async getETHPrice(): Promise<number> {
    try {
      const query = `
        query {
          bundle(id: "1") {
            ethPriceUSD
          }
        }
      `;

      const response = await axios.post(
        this.SUBGRAPH_URL,
        { query },
        { timeout: 10000 }
      );

      const data = response.data?.data;
      return parseFloat(data?.bundle?.ethPriceUSD) || 2400;
    } catch (error) {
      console.warn('Failed to get ETH price:', error.message);
      return 2400; // Fallback
    }
  }
}
