import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface PriceSource {
  source: string;
  price: number;
  confidence: number; // 0-1, higher = more reliable
}

@Injectable()
export class PricesService {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly UNISWAP_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
  private readonly BIRDEYE_API = 'https://public-api.birdeye.so';
  private priceCache = new Map<string, any>();
  private cacheExpiry = 600000; // 10 minutes
  private lastApiCall = 0;
  private minDelayBetweenCalls = 300; // 300ms between API calls

  /**
   * Get price by contract address (more reliable for obscure tokens)
   * Tries CoinGecko first, then CoinMarketCap, then returns $0
   */
  async getPriceByAddress(contractAddress: string, chain: string = 'ethereum') {
    const cacheKey = `addr:${contractAddress}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      const priceSources: PriceSource[] = [];

      // Try Uniswap V3 (most accurate for EVM)
      if (chain.toLowerCase() === 'ethereum' || chain.toLowerCase() === 'polygon') {
        const uniPrice = await this.tryGetPriceFromUniswapV3(contractAddress);
        if (uniPrice) {
          priceSources.push({ source: 'uniswap-v3', price: uniPrice, confidence: 0.95 });
        }
      }

      // Try Birdeye (Solana-specific)
      if (chain.toLowerCase() === 'solana') {
        const birdeyePrice = await this.tryGetPriceFromBirdeye(contractAddress, chain);
        if (birdeyePrice) {
          priceSources.push({ source: 'birdeye', price: birdeyePrice, confidence: 0.9 });
        }
      }

      // Try CoinGecko by contract address (reliable for major tokens)
      const cgPrice = await this.tryGetPriceFromCoinGecko(contractAddress, chain);
      if (cgPrice && cgPrice.price > 0) {
        priceSources.push({ source: 'coingecko', price: cgPrice.price, confidence: 0.8 });
      }

      // Note: Symbol-based lookup happens in wallet scanner where we have token symbols

      // Try CoinMarketCap (backup)
      const cmcPrice = await this.tryGetPriceFromCoinMarketCap(contractAddress);
      if (cmcPrice && cmcPrice.price > 0) {
        priceSources.push({ source: 'coinmarketcap', price: cmcPrice.price, confidence: 0.7 });
      }

      // Try 1inch DEX (fallback for EVM)
      if (chain.toLowerCase() === 'ethereum') {
        const dexPrice = await this.tryGetPriceFromDex(contractAddress, chain);
        if (dexPrice && dexPrice.price > 0) {
          priceSources.push({ source: 'dex-1inch', price: dexPrice.price, confidence: 0.75 });
        }
      }

      // Aggregate prices from all sources
      if (priceSources.length > 0) {
        const aggregatedPrice = this.aggregatePrices(priceSources);
        const priceData = {
          address: contractAddress,
          price: aggregatedPrice,
          current_price: aggregatedPrice,
          sources: priceSources.map(s => s.source).join(', '),
          fetchedAt: Date.now(),
        };
        this.priceCache.set(cacheKey, priceData);
        return priceData;
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
  private aggregatePrices(sources: PriceSource[]): number {
    if (sources.length === 0) return 0;

    // Prioritize CoinGecko (most reliable for known tokens, faster than DEX)
    const cgPrice = sources.find(s => s.source === 'coingecko');
    if (cgPrice && cgPrice.price > 0) {
      return cgPrice.price;
    }

    // Fall back to CoinMarketCap
    const cmcPrice = sources.find(s => s.source === 'coinmarketcap');
    if (cmcPrice && cmcPrice.price > 0) {
      return cmcPrice.price;
    }

    // Fall back to DEX for unknown tokens
    const dexPrice = sources.find(s => s.source.includes('dex') || s.source.includes('uniswap'));
    if (dexPrice && dexPrice.price > 0) {
      return dexPrice.price;
    }

    // Take highest confidence if all above failed
    sources.sort((a, b) => b.confidence - a.confidence);
    return sources[0]?.price || 0;
  }

  private async tryGetPriceFromUniswapV3(contractAddress: string): Promise<number | null> {
    try {
      await this.throttleApiCall();

      const query = `
        query {
          tokens(first: 1, where: { id: "${contractAddress.toLowerCase()}" }) {
            id
            symbol
            derivedETH
          }
          bundle(id: "1") {
            ethPriceUSD
          }
        }
      `;

      const response = await axios.post(
        this.UNISWAP_SUBGRAPH,
        { query },
        { timeout: 5000 }
      );

      const token = response.data?.data?.tokens?.[0];
      const ethPrice = parseFloat(response.data?.data?.bundle?.ethPriceUSD || '0');

      if (token && ethPrice && parseFloat(token.derivedETH) > 0) {
        const price = parseFloat(token.derivedETH) * ethPrice;
        if (price > 0) {
          return price;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async tryGetPriceFromBirdeye(tokenAddress: string, chain: string = 'solana'): Promise<number | null> {
    try {
      await this.throttleApiCall();

      const response = await axios.get(
        `${this.BIRDEYE_API}/defi/price?address=${tokenAddress}`,
        { timeout: 5000 }
      );

      const price = response.data?.data?.value;
      if (price && parseFloat(price) > 0) {
        return parseFloat(price);
      }
      return null;
    } catch (error) {
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
