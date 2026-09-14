import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface PriceData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: number;
}

@Injectable()
export class PriceProviderService {
  private readonly coinGeckoKey = process.env.COINGECKO_API_KEY || '';
  private readonly coinMarketCapKey = process.env.COINMARKETCAP_API_KEY || '';
  private readonly cache = new Map<string, { price: number; timestamp: number }>();
  private readonly cacheDuration = 60 * 1000; // 1 minute

  /**
   * Get price from primary provider (CoinGecko) or fallback to CoinMarketCap
   */
  async getPrice(symbol: string, vs_currency: string = 'usd'): Promise<PriceData> {
    const cacheKey = `${symbol}:${vs_currency}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return {
          symbol,
          price: cached.price,
          currency: vs_currency,
          timestamp: cached.timestamp,
        };
      }
    }

    try {
      // Try CoinGecko first
      const price = await this.getPriceFromCoinGecko(symbol, vs_currency);

      // Cache the result
      this.cache.set(cacheKey, {
        price,
        timestamp: Date.now(),
      });

      return {
        symbol,
        price,
        currency: vs_currency,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn(`CoinGecko failed for ${symbol}, trying CoinMarketCap...`);

      try {
        // Fallback to CoinMarketCap
        const price = await this.getPriceFromCoinMarketCap(symbol, vs_currency);

        this.cache.set(cacheKey, {
          price,
          timestamp: Date.now(),
        });

        return {
          symbol,
          price,
          currency: vs_currency,
          timestamp: Date.now(),
        };
      } catch (fallbackError) {
        console.error(`All price providers failed for ${symbol}:`, fallbackError);
        return {
          symbol,
          price: 0,
          currency: vs_currency,
          timestamp: Date.now(),
        };
      }
    }
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(
    symbols: string[],
    vs_currency: string = 'usd',
  ): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    // Try batch request from CoinGecko
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: symbols.map(s => this.symbolToCoingeckoId(s)).join(','),
          vs_currencies: vs_currency,
          api_key: this.coinGeckoKey,
        },
      });

      for (const symbol of symbols) {
        const id = this.symbolToCoingeckoId(symbol);
        if (response.data[id]?.[vs_currency]) {
          prices[symbol] = response.data[id][vs_currency];
          this.cache.set(`${symbol}:${vs_currency}`, {
            price: response.data[id][vs_currency],
            timestamp: Date.now(),
          });
        }
      }

      return prices;
    } catch (error) {
      console.warn('Batch price fetch failed, falling back to individual requests');

      for (const symbol of symbols) {
        try {
          const price = await this.getPrice(symbol, vs_currency);
          prices[symbol] = price.price;
        } catch (e) {
          prices[symbol] = 0;
        }
      }

      return prices;
    }
  }

  /**
   * Get price from CoinGecko
   */
  private async getPriceFromCoinGecko(symbol: string, vs_currency: string): Promise<number> {
    const id = this.symbolToCoingeckoId(symbol);

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: id,
          vs_currencies: vs_currency,
          api_key: this.coinGeckoKey,
        },
      },
    );

    return response.data[id]?.[vs_currency] || 0;
  }

  /**
   * Get price from CoinMarketCap (fallback provider)
   */
  private async getPriceFromCoinMarketCap(symbol: string, vs_currency: string): Promise<number> {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/tools/price-conversion', {
      params: {
        symbol: symbol.toUpperCase(),
        convert: vs_currency.toUpperCase(),
        amount: 1,
      },
      headers: {
        'X-CMC_PRO_API_KEY': this.coinMarketCapKey,
      },
    });

    const quote = response.data?.data?.quote?.[vs_currency.toUpperCase()];
    return quote?.price || 0;
  }

  /**
   * Map token symbol to CoinGecko ID
   */
  private symbolToCoingeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDC: 'usd-coin',
      USDT: 'tether',
      DAI: 'dai',
      LINK: 'chainlink',
      AAVE: 'aave',
      UNI: 'uniswap',
      MATIC: 'matic-network',
      SOL: 'solana',
      ADA: 'cardano',
      DOT: 'polkadot',
      AVAX: 'avalanche-2',
      ARB: 'arbitrum',
      OP: 'optimism',
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
