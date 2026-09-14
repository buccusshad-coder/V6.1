# Multi-Provider API Integration Guide

## 🌐 Supported Blockchain Networks

The Tracker v7 now supports real data from 6+ major blockchains through multiple providers:

| Chain | Provider | API Service | Status |
|-------|----------|-------------|--------|
| **Ethereum** | Etherscan | ✅ Active | EtherscanService |
| **Polygon** | Polygonscan | ✅ Active | EtherscanService |
| **Arbitrum** | Arbiscan | ✅ Active | EtherscanService |
| **Base** | Basescan | ✅ Active | EtherscanService |
| **Optimism** | Optimistic Etherscan | ✅ Active | EtherscanService |
| **Solana** | Helius RPC | ✅ Active | HeliusService |

---

## 🔑 Configured API Keys

All API keys have been configured in `backend/.env`:

### Blockchain Data Providers

```
ETHERSCAN_API_KEY=K19C2FJTWJCM4JMMD9ZCG6BB7MUGHTRC7J          (Primary)
ETHERSCAN_ALT_API_KEY=WYG5QMURAUUZBNKHPXKVST7WZPQ8KUJ8VD     (Fallback)
ALCHEMY_API_KEY=alch_8EkPWa10iQb-uMn-ufARRvoici               (RPC Provider)
INFURA_API_KEY=7e9cd7b412ad4047bddbebea0de922eb              (RPC Provider)
HELIUS_API_KEY=3bcb0498-c4e2-4731-9da2-d10a2b921e5b          (Solana RPC)
SOLANA_RPC_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   (Solana Token API)
```

### Price Data Providers

```
COINGECKO_API_KEY=CG-KhifCG3x8RMcoHtUcF6ymFg9                 (Primary)
COINMARKETCAP_API_KEY=9d3cce69315c434abebd716437c0423b        (Fallback)
```

---

## 📊 Services Architecture

### EtherscanService (EVM Chains)

Handles Ethereum and EVM-compatible chains:

```typescript
// Token balances with fallback support
const balances = await etherscanService.getTokenBalances(address, 'ethereum');

// Transaction history with pagination
const txs = await etherscanService.getTokenTransfers(address, 'ethereum');

// Token metadata
const metadata = await etherscanService.getTokenMetadata(tokenAddress, 'ethereum');

// Health checks and chain list
const health = await etherscanService.checkHealth();
const chains = etherscanService.getSupportedChains();
```

**Fallback Strategy:**
- Primary: Main Etherscan API key
- Secondary: Alternate Etherscan API key
- Tertiary: Alchemy or Infura RPC (if needed)

### HeliusService (Solana)

Handles Solana blockchain via Helius RPC:

```typescript
// Solana token balances
const tokens = await heliusService.getTokenBalances(walletAddress);

// SOL balance (native coin)
const solBalance = await heliusService.getSolBalance(walletAddress);

// Transaction history
const txs = await heliusService.getTransactionHistory(walletAddress, limit: 50);

// Token metadata
const metadata = await heliusService.getTokenMetadata(mintAddress);
```

**Features:**
- Detects swap transactions from DEX programs
- Tracks token transfers and burns
- Identifies SOL transfers vs token transfers
- Supports Raydium, Orca, Magic Eden interactions

### PriceProviderService

Unified price data from multiple sources:

```typescript
// Single price with fallback
const price = await priceProvider.getPrice('ETH', 'usd');

// Batch prices for efficiency
const prices = await priceProvider.getPrices(['ETH', 'BTC', 'SOL'], 'usd');

// Cache statistics
const stats = priceProvider.getCacheStats();

// Clear cache if needed
priceProvider.clearCache();
```

**Fallback Strategy:**
- Primary: CoinGecko (free tier, 100 calls/min)
- Secondary: CoinMarketCap (fallback provider)
- Caching: 1-minute TTL to reduce API calls

---

## 🎯 Use Cases by Chain

### Ethereum / Polygon / Arbitrum / Base / Optimism

**Get User Holdings:**
```typescript
const holdings = await walletScannerService.scanWalletBalance(
  '0xuser...',
  'ethereum'
);
// Returns: [{symbol: 'USDC', amount: '1000', value: '$1000'}, ...]
```

**Trace Token Journey:**
```typescript
const trace = await walletScannerService.traceTokenOrigin(
  '0xuser...',
  '0xusdc...',
  'ethereum',
  depth: 10
);
// Returns: path with all transfers, swaps, bridges
```

**Detect Swaps:**
```typescript
const swaps = await walletScannerService.getSwapHistory(
  '0xuser...',
  'ethereum'
);
// Returns: [{fromToken: 'USDC', toToken: 'ETH', ...}, ...]
```

### Solana

**Get SOL & Token Holdings:**
```typescript
const sol = await heliusService.getSolBalance(walletAddress);
const tokens = await heliusService.getTokenBalances(walletAddress);
// Returns: SOL + all SPL token balances
```

**Get Transaction History:**
```typescript
const history = await heliusService.getTransactionHistory(
  walletAddress,
  limit: 100
);
// Returns: All transactions with type detection (transfer, swap, etc)
```

---

## 🔄 Data Flow with Fallbacks

### Primary Path (Healthy)
```
User Request
    ↓
EtherscanService (Primary Key)
    ↓
Success ✅
```

### Fallback Path (Primary Fails)
```
User Request
    ↓
EtherscanService (Primary Key) → ❌ Fails
    ↓
EtherscanService (Alternate Key) → ✅ Success
```

### Price Data Path
```
Get Price Request
    ↓
CoinGecko API → ✅ Success
    ↓
Return cached price (1 min TTL)

---

Get Price Request
    ↓
CoinGecko API → ❌ Fails (rate limited)
    ↓
CoinMarketCap API → ✅ Success
    ↓
Cache and return
```

---

## ⚡ Rate Limits & Quotas

### Etherscan (Free Tier)
- **Calls/Second:** 5
- **Calls/Day:** 100,000
- **Batch Limit:** Single address per query

### CoinGecko (Free Tier)
- **Calls/Minute:** 10-50
- **Batch Limit:** Up to 250 IDs per request
- **Recommended:** Use batch calls for multiple tokens

### CoinMarketCap (Free Tier)
- **Calls/Month:** 333
- **Calls/Second:** ~1
- **Best For:** Fallback when CoinGecko is rate-limited

### Helius (Free Tier)
- **Calls/Second:** 100
- **Daily Limit:** Generous (suitable for production)

---

## 🚀 Best Practices

### 1. Batch Requests
```typescript
// ❌ Bad: 10 individual calls
for (const symbol of symbols) {
  const price = await priceProvider.getPrice(symbol);
}

// ✅ Good: 1 batch call
const prices = await priceProvider.getPrices(symbols);
```

### 2. Cache Strategy
```typescript
// Already built-in with 1-minute TTL
// Cache automatically clears old entries

// Check cache statistics
const stats = priceProvider.getCacheStats();
console.log(`Cached entries: ${stats.size}`);
```

### 3. Error Handling
```typescript
try {
  const balances = await etherscanService.getTokenBalances(address, 'ethereum');
  // Service automatically tries fallback
} catch (error) {
  console.error('All providers failed:', error);
  // Gracefully degrade
}
```

### 4. Health Checks
```typescript
// Check provider health before operations
const health = await etherscanService.checkHealth();
if (!health.primary && !health.alternate) {
  // Alert: Both Etherscan keys failing
  // Try fallback to Alchemy
}
```

---

## 📈 Monitoring & Logging

### Check API Health
```bash
curl http://localhost:3000/api/integrations/health
```

Expected response:
```json
{
  "etherscan": {
    "primary": true,
    "alternate": true,
    "status": "healthy"
  },
  "helius": {
    "status": "healthy"
  },
  "prices": {
    "coingecko": true,
    "coinmarketcap": true,
    "status": "healthy"
  }
}
```

### Cache Hit Rate
```typescript
const stats = priceProvider.getCacheStats();
// {size: 42, entries: ['ETH:usd', 'BTC:usd', ...]}
```

---

## 🔧 Configuration for Production

### Environment Setup

```bash
# 1. Create .env.production
cp .env .env.production

# 2. Update with production keys (if different)
ETHERSCAN_API_KEY=prod-key-here
HELIUS_API_KEY=prod-key-here

# 3. Increase rate limits with paid tiers
ETHERSCAN_API_KEY=paid-key-higher-limits
COINMARKETCAP_API_KEY=paid-key-1000-calls
```

### Docker Compose
```yaml
services:
  backend:
    environment:
      ETHERSCAN_API_KEY: ${ETHERSCAN_API_KEY}
      HELIUS_API_KEY: ${HELIUS_API_KEY}
      COINGECKO_API_KEY: ${COINGECKO_API_KEY}
```

---

## 🐛 Troubleshooting

### "Rate limit exceeded"
```
Solution 1: Use CoinMarketCap as fallback (automatic)
Solution 2: Upgrade to paid API tier
Solution 3: Implement request queuing/delays
Solution 4: Increase cache TTL to 5+ minutes
```

### "API key invalid"
```
Solution 1: Verify key in .env matches dashboard
Solution 2: Regenerate key in provider dashboard
Solution 3: Check alternate/fallback key
Solution 4: Try CoinMarketCap fallback
```

### "Solana wallet not found"
```
Solution 1: Verify wallet address is valid Solana address
Solution 2: Try with public wallet (e.g., raydium program)
Solution 3: Check Helius API is active
Solution 4: Fallback to read-only (can't fetch private data)
```

### "Token metadata missing"
```
Solution: Token may be new/unverified
Fallback: Use default metadata (unknown, decimals: 18)
Option: Fetch from token program directly via Helius
```

---

## 📊 Current Configuration Summary

```
✅ EVM Chains (5): Ethereum, Polygon, Arbitrum, Base, Optimism
✅ L1/L2 Support: Full compatibility with all major chains
✅ Solana: Full support via Helius
✅ Price Data: CoinGecko + CoinMarketCap fallback
✅ Fallback Keys: 2 Etherscan keys for redundancy
✅ RPC Providers: Alchemy + Infura available
✅ Rate Limits: Within free tier (with fallbacks)
✅ Caching: 1-minute TTL for prices
✅ Health Checks: Available at /api/integrations/health
```

---

## 🚀 Future Enhancements

- [ ] GraphQL support (Subgraph queries)
- [ ] Historical price charts (CoinGecko API v3)
- [ ] DEX analytics (Uniswap Graph)
- [ ] NFT support (Magic Eden, OpenSea)
- [ ] Lending protocol tracking (Aave, Compound)
- [ ] Swap aggregator data (1inch, 0x)
- [ ] On-chain analytics dashboard
- [ ] Real-time price feeds via WebSocket

---

## 📚 Resources

- **Etherscan API**: https://docs.etherscan.io/
- **Helius RPC**: https://docs.helius.xyz/
- **CoinGecko**: https://docs.coingecko.com/reference/api-overview
- **CoinMarketCap**: https://coinmarketcap.com/api/documentation/v1/
- **Alchemy**: https://docs.alchemy.com/
- **Infura**: https://docs.infura.io/

