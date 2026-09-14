import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PricesService {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private priceCache = new Map<string, any>();
  private cacheExpiry = 60000; // 1 minute

  /**
   * Get price by contract address (more reliable for obscure tokens)
   */
  async getPriceByAddress(contractAddress: string, chain: string = 'ethereum') {
    const cacheKey = `addr:${contractAddress}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      // Map chain names to CoinGecko platform IDs
      const chainMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon',
        arbitrum: 'arbitrum-one',
        base: 'base',
        optimism: 'optimistic-ethereum',
      };
      const platform = chainMap[chain.toLowerCase()] || 'ethereum';

      const response = await axios.get(
        `${this.COINGECKO_API}/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        { timeout: 5000 }
      );

      const data = response.data[contractAddress.toLowerCase()] || {};
      const priceData = {
        address: contractAddress,
        price: data.usd || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        change24h: data.usd_24h_change || 0,
        fetchedAt: Date.now(),
        current_price: data.usd || 0, // Alias for compatibility
      };

      this.priceCache.set(cacheKey, priceData);
      return priceData;
    } catch (error) {
      console.warn(`⚠️  Failed to fetch price for address ${contractAddress}:`, error.message);
      return {
        address: contractAddress,
        price: 0,
        current_price: 0,
        fetchedAt: Date.now(),
      };
    }
  }

  async getLatestPrice(symbol: string) {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.COINGECKO_API}/simple/price?ids=${symbol}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        { timeout: 5000 }
      );

      const data = response.data[symbol.toLowerCase()] || {};
      const priceData = {
        symbol,
        current_price: data.usd || 0,
        price: data.usd || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        change24h: data.usd_24h_change || 0,
        fetchedAt: Date.now(),
      };

      this.priceCache.set(symbol, priceData);
      return priceData;
    } catch (error) {
      console.warn(`⚠️  Failed to fetch price for ${symbol}:`, error.message);
      return {
        symbol,
        current_price: 0,
        price: 0,
        error: 'Failed to fetch price',
      };
    }
  }

  async getPriceHistory(symbol: string, days: number = 7) {
    try {
      const response = await axios.get(
        `${this.COINGECKO_API}/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`,
      );
      return response.data.prices; // Array of [timestamp, price]
    } catch (error) {
      console.error(`Failed to fetch price history for ${symbol}:`, error.message);
      return [];
    }
  }

  async getMultiplePrices(symbols: string[]) {
    const prices = await Promise.all(
      symbols.map((symbol) => this.getLatestPrice(symbol)),
    );
    return prices;
  }

  clearCache(symbol?: string) {
    if (symbol) {
      this.priceCache.delete(symbol);
    } else {
      this.priceCache.clear();
    }
  }
}
