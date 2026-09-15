import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface PriceSource {
  source: string;
  price: number;
  confidence: number; // 0-1, higher = more reliable
}

@Injectable()
export class PricesService {
  private readonly DEXSCREENER_API = 'https://api.dexscreener.com';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private priceCache = new Map<string, any>();
  private cacheExpiry = 180000; // 3 minutes (DexScreener recommendation)
  private lastApiCall = 0;
  private minDelayBetweenCalls = 200; // 200ms between API calls

  /**
   * Get price by contract address using DexScreener (best for all tokens including memes)
   * DexScreener aggregates DEX prices - works for every token with liquidity
   */
  async getPriceByAddress(contractAddress: string, chain: string = 'ethereum') {
    const cacheKey = `addr:${contractAddress}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      // PRIMARY: Try DexScreener first (works for ALL tokens with DEX liquidity)
      const dexPrice = await this.tryGetPriceFromDexScreener(contractAddress, chain);
      if (dexPrice) {
        this.priceCache.set(cacheKey, { ...dexPrice, source: 'dexscreener' });
        return { ...dexPrice, source: 'dexscreener', current_price: dexPrice.price };
      }

      // FALLBACK: CoinGecko for major tokens not on DEX
      const cgPrice = await this.tryGetPriceFromCoinGecko(contractAddress, chain);
      if (cgPrice && cgPrice.price > 0) {
        this.priceCache.set(cacheKey, cgPrice);
        return cgPrice;
      }


      // Return zero price if all sources fail
      const fallback = {
        address: contractAddress,
        price: 0,
        current_price: 0,
        sources: 'none',
        fetchedAt: Date.now(),
      };
      this.priceCache.set(cacheKey, fallback);
      return fallback;
    } catch (error) {
      console.warn(`⚠️  Failed to fetch price for address ${contractAddress}:`, error.message);
      return {
        address: contractAddress,
        price: 0,
        current_price: 0,
        sources: 'error',
        fetchedAt: Date.now(),
      };
    }
  }

  private async tryGetPriceFromCoinGecko(contractAddress: string, chain: string) {
    try {
      const chainMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon',
        arbitrum: 'arbitrum-one',
        base: 'base',
        optimism: 'optimistic-ethereum',
      };
      const platform = chainMap[chain.toLowerCase()] || 'ethereum';

      await this.throttleApiCall();
      const response = await axios.get(
        `${this.COINGECKO_API}/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        { timeout: 5000 }
      );

      const data = response.data[contractAddress.toLowerCase()] || {};
      if (!data.usd) return null;

      return {
        address: contractAddress,
        price: data.usd || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        change24h: data.usd_24h_change || 0,
        fetchedAt: Date.now(),
        current_price: data.usd || 0,
        source: 'coingecko',
      };
    } catch (error) {
      return null;
    }
  }

  private async tryGetPriceFromCoinMarketCap(contractAddress: string) {
    try {
      const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
      if (!cmcApiKey) return null;

      const response = await axios.get(
        `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=1&symbol=USD&convert=USD&address=${contractAddress}`,
        {
          headers: { 'X-CMC_PRO_API_KEY': cmcApiKey },
          timeout: 5000,
        }
      );

      // Try alternative CoinMarketCap endpoint for token lookup
      const response2 = await axios.get(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?address=${contractAddress}`,
        {
          headers: { 'X-CMC_PRO_API_KEY': cmcApiKey },
          timeout: 5000,
        }
      );

      const data = response2.data?.data;
      if (!data) return null;

      // Get price from quotes if available
      const tokenData = Object.values(data)[0] as any;
      const quote = tokenData?.quote?.USD;
      if (quote && quote.price) {
        return {
          address: contractAddress,
          price: quote.price,
          marketCap: quote.market_cap || 0,
          volume24h: quote.volume_24h || 0,
          change24h: quote.percent_change_24h || 0,
          fetchedAt: Date.now(),
          current_price: quote.price,
          source: 'coinmarketcap',
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Aggregate prices from multiple sources, prefer DEX > CoinGecko > CoinMarketCap
   */

  private async tryGetPriceFromDexScreener(contractAddress: string, chain: string): Promise<any | null> {
    try {
      await this.throttleApiCall();

      // Map chain to DexScreener chain id
      const chainMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon',
        arbitrum: 'arbitrum',
        base: 'base',
        optimism: 'optimism',
        solana: 'solana',
      };
      const chainId = chainMap[chain.toLowerCase()] || 'ethereum';

      const url = `${this.DEXSCREENER_API}/latest/dex/tokens/${chainId}/${contractAddress}`;
      const response = await axios.get(url, { timeout: 5000 });

      const pair = response.data?.pairs?.[0];
      if (pair && pair.priceUsd && parseFloat(pair.priceUsd) > 0) {
        const price = parseFloat(pair.priceUsd);
        console.log(`💰 DexScreener ${contractAddress.substring(0,8)}: $${price}`);
        return {
          address: contractAddress,
          price,
          current_price: price,
          fetchedAt: Date.now(),
        };
      }
      return null;
    } catch (error) {
      console.log(`⚠️ DexScreener ${contractAddress.substring(0,8)}: ${error.message}`);
      return null;
    }
  }



  private async tryGetPriceFromDex(contractAddress: string, chain: string = 'ethereum') {
    try {
      if (chain.toLowerCase() === 'ethereum') {
        // Use 1inch API for Ethereum
        const response = await axios.get(
          `https://api.1inch.io/v5.0/1/quote?src=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&dst=${contractAddress}&amount=1000000000000000000`,
          { timeout: 5000 }
        );

        if (response.data?.toTokenAmount) {
          const price = parseFloat(response.data.toTokenAmount) / 1e18;
          if (price > 0) {
            return {
              address: contractAddress,
              price,
              marketCap: 0,
              volume24h: 0,
              change24h: 0,
              fetchedAt: Date.now(),
              current_price: price,
              source: 'dex-1inch',
            };
          }
        }
      } else if (chain.toLowerCase() === 'solana') {
        // Use Jupiter API for Solana
        const response = await axios.get(
          `https://price.jup.ag/v4/price?ids=${contractAddress}`,
          { timeout: 5000 }
        );

        const data = response.data?.data?.[contractAddress];
        if (data?.price && data.price > 0) {
          return {
            address: contractAddress,
            price: parseFloat(data.price),
            marketCap: 0,
            volume24h: 0,
            change24h: 0,
            fetchedAt: Date.now(),
            current_price: parseFloat(data.price),
            source: 'dex-jupiter',
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async throttleApiCall() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.minDelayBetweenCalls) {
      await new Promise(resolve => setTimeout(resolve, this.minDelayBetweenCalls - timeSinceLastCall));
    }
    this.lastApiCall = Date.now();
  }

  async getLatestPrice(symbol: string) {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      await this.throttleApiCall();
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
