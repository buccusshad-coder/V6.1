import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UniswapService } from '../../integrations/uniswap.service';

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
  private cacheExpiry = 300000; // 5 minutes (increased for rate limit protection)
  private lastApiCall = 0;
  private minDelayBetweenCalls = 500; // Increased to 500ms to avoid CoinGecko rate limits

  constructor(private uniswapService: UniswapService) {}

  // Whitelist of verified, real tokens (prevents symbol collision false matches)
  private readonly SYMBOL_WHITELIST = new Set([
    // Stablecoins
    'usdc', 'usdt', 'dai', 'busd', 'tusd', 'frax', 'usde',
    // Major chains & Layer-2
    'eth', 'ethereum', 'btc', 'bitcoin', 'sol', 'solana', 'bnb', 'avax', 'matic', 'polygon', 'pol',
    'ftm', 'fantom', 'one', 'harmony', 'arbitrum', 'optimism', 'op', 'base',
    // Wrapped tokens
    'weth', 'wbtc', 'wsol', 'wmatic', 'wbnb', 'wavax',
    // Major DEX/protocols
    'uni', 'uniswap', 'sushi', 'aave', 'curve', 'crv', 'comp', 'compound', 'mkr', 'maker', 'snx', 'yearn', 'yfi',
    // Lending/staking
    'lido', 'steth', 'rpl', 'rocket', 'aura', 'cvx', 'convex',
    // Solana tokens
    'bonk', 'samo', 'orca', 'ray', 'step', 'cope', 'srm', 'ftt', 'msol', 'ust', 'raydium', 'jup', 'jupiter',
    // Real altcoins & oracles
    'link', 'chainlink', 'graph', 'grt', 'lpt', 'livepeer', 'ark', 'ilv', 'gmx', 'ens', 'ethername',
    // Vitalik holdings
    'near', 'inj', 'injective', 'qnt', 'quant', 'render', 'rndr', 'vita', 'joe', 'traderjoe',
    'ondo', 'imx', 'immutable', 'virtual', 'degen', 'anime', 'banana', 'lcx', 'aster', 'toshi', 'blast'
  ])

  /**
   * Get price by contract address using DexScreener (best for all tokens including memes)
   * DexScreener aggregates DEX prices - works for every token with liquidity
   */
  async getPriceByAddress(contractAddress: string, chain: string = 'ethereum', tokenSymbol?: string) {
    const cacheKey = `addr:${contractAddress}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached;
    }

    try {
      // PRIMARY: Try DexScreener first (works for ALL tokens with DEX liquidity)
      const dexPrice = await this.tryGetPriceFromDexScreener(contractAddress, chain);
      if (dexPrice && dexPrice.price > 0) {
        this.priceCache.set(cacheKey, { ...dexPrice, source: 'dexscreener' });
        return { ...dexPrice, source: 'dexscreener', current_price: dexPrice.price };
      }

      // FALLBACK 1: CoinGecko contract address lookup
      const cgPrice = await this.tryGetPriceFromCoinGecko(contractAddress, chain);
      if (cgPrice && cgPrice.price > 0) {
        this.priceCache.set(cacheKey, cgPrice);
        return cgPrice;
      }

      // FALLBACK 2: 1inch DEX for Ethereum, Jupiter for Solana
      if (chain.toLowerCase() === 'ethereum' || chain.toLowerCase() === 'solana') {
        const dexPrice = await this.tryGetPriceFromDex(contractAddress, chain);
        if (dexPrice && dexPrice.price > 0) {
          this.priceCache.set(cacheKey, dexPrice);
          return dexPrice;
        }
      }

      // FALLBACK 3: Uniswap V3 subgraph (on-chain pricing for Ethereum tokens)
      if (chain.toLowerCase() === 'ethereum') {
        try {
          const uniswapPrice = await this.uniswapService.getTokenPriceFromUniswap(contractAddress);
          if (uniswapPrice && uniswapPrice > 0) {
            const result = {
              address: contractAddress,
              price: uniswapPrice,
              current_price: uniswapPrice,
              source: 'uniswap-v3',
              fetchedAt: Date.now(),
            };
            this.priceCache.set(cacheKey, result);
            return result;
          }
        } catch (e) {
          console.warn(`Uniswap price fetch failed for ${contractAddress}:`, e.message);
        }
      }

      // FALLBACK 4: SYMBOL LOOKUP with whitelist (prevents symbol collisions)
      if (tokenSymbol) {
        const cleanSymbol = tokenSymbol.toLowerCase();
        // Try whitelisted symbols first
        if (this.SYMBOL_WHITELIST.has(cleanSymbol)) {
          try {
            const symbolPrice = await this.getLatestPrice(cleanSymbol);
            if (symbolPrice && symbolPrice.current_price > 0) {
              this.priceCache.set(cacheKey, symbolPrice);
              return { ...symbolPrice, source: 'symbol-whitelist' };
            }
          } catch (e) {
            console.warn(`Symbol lookup failed for whitelisted ${cleanSymbol}:`, e.message);
          }
        }
      }

      // No price found - return zero price
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
      const apiKey = process.env.COINGECKO_API_KEY;
      const keyParam = apiKey ? `&x_cg_pro_api_key=${apiKey}` : '';

      const response = await axios.get(
        `${this.COINGECKO_API}/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true${keyParam}`,
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
      const lowerAddr = contractAddress.toLowerCase();

      // Use proven endpoints from tracker-final: /tokens/v1/ for EVM, /latest/dex/tokens/ for Solana
      const url = chain.toLowerCase() === 'solana'
        ? `${this.DEXSCREENER_API}/latest/dex/tokens/${lowerAddr}`
        : `${this.DEXSCREENER_API}/tokens/v1/${chainId}/${lowerAddr}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Handle both array and object responses (like tracker-final)
      const pairs = Array.isArray(response.data) ? response.data : (response.data?.pairs || []);

      if (pairs.length) {
        const pair = pairs[0];
        const price = parseFloat(pair?.priceUsd);

        if (price && price > 0) {
          return {
            address: contractAddress,
            price,
            current_price: price,
            symbol: pair.baseToken?.symbol,
            name: pair.baseToken?.name,
            fetchedAt: Date.now(),
          };
        }
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
      const apiKey = process.env.COINGECKO_API_KEY;
      const keyParam = apiKey ? `&x_cg_pro_api_key=${apiKey}` : '';

      const response = await axios.get(
        `${this.COINGECKO_API}/simple/price?ids=${symbol}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true${keyParam}`,
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
