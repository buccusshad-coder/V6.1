# Etherscan API Integration Guide

## 📋 Overview

The Tracker v7 application integrates with Etherscan APIs to enable real-time blockchain data fetching, wallet scanning, and token tracing. This allows users to:

- **Scan wallets** to automatically discover all token holdings
- **Trace tokens** to see complete journey from mint to current location
- **Detect swaps** by analyzing transaction patterns
- **Track transfers** across wallets and protocols
- **Get live prices** for accurate portfolio valuations

---

## 🚀 Quick Start

### 1. Get Etherscan API Key

Visit [https://etherscan.io/apis](https://etherscan.io/apis) and sign up:

- **Free Tier**: 5 calls/sec, 100,000 calls/day
- **Paid Tiers**: Higher rate limits available

### 2. Configure API Key

Add to `backend/.env`:

```env
ETHERSCAN_API_KEY=your-api-key-here
POLYGONSCAN_API_KEY=your-polygon-api-key
```

### 3. Start Backend

```bash
cd backend
npm install
npm run start:dev
```

---

## 🔧 Architecture

### EtherscanService (`backend/src/integrations/etherscan.service.ts`)

Core service for all Etherscan API interactions:

```typescript
// Get all tokens in wallet
const tokens = await etherscanService.getTokenBalances(walletAddress, 'ethereum');

// Get transaction history
const txs = await etherscanService.getTokenTransfers(walletAddress, 'ethereum');

// Get token metadata
const metadata = await etherscanService.getTokenMetadata(tokenAddress, 'ethereum');

// Check if address is contract
const isContract = await etherscanService.isContract(address, 'ethereum');

// Get gas prices
const gasPrices = await etherscanService.getGasTracker('ethereum');
```

### WalletScannerService (`backend/src/modules/wallets/wallet-scanner.service.ts`)

High-level wallet scanning and token tracing:

```typescript
// Scan wallet and get all holdings with prices
const holdings = await walletScannerService.scanWalletBalance(walletAddress, 'ethereum');

// Get transaction history for specific token
const history = await walletScannerService.getTokenTransactionHistory(
  walletAddress,
  tokenAddress,
  'ethereum'
);

// Trace token back to origin
const trace = await walletScannerService.traceTokenOrigin(
  walletAddress,
  tokenAddress,
  'ethereum',
  depth: 5 // how many steps back to trace
);

// Get all swaps for wallet
const swaps = await walletScannerService.getSwapHistory(walletAddress, 'ethereum');
```

---

## 📱 API Endpoints

### Wallet Scanning

**POST** `/api/wallets/:id/scan`

Scans wallet and returns all token holdings with current prices:

```bash
curl -X POST http://localhost:3000/api/wallets/wallet-123/scan \
  -H "Authorization: Bearer {token}"
```

**Response:**

```json
[
  {
    "symbol": "ETH",
    "name": "Ethereum",
    "address": "0x0000000000000000000000000000000000000000",
    "amount": "2.5",
    "decimals": 18,
    "value": 5000
  },
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "amount": "10000",
    "decimals": 6,
    "value": 10000
  }
]
```

### Token Tracing

**GET** `/api/tokens/trace/:tokenAddress/:chain`

Get complete token journey:

```bash
curl http://localhost:3000/api/tokens/trace/0x...abc/ethereum \
  -H "Authorization: Bearer {token}"
```

**GET** `/api/tokens/trace/:tokenAddress/:chain/table`

Get Excel-like format for frontend display:

```bash
curl http://localhost:3000/api/tokens/trace/0x...abc/ethereum/table \
  -H "Authorization: Bearer {token}"
```

**Response:**

```json
[
  {
    "step": 1,
    "action": "TRANSFER",
    "from": "0xaa...",
    "to": "0xbb...",
    "amount": "100",
    "price": "$50.00",
    "value": "$5000",
    "date": "3/1/2024",
    "txHash": "0x123..."
  }
]
```

**GET** `/api/tokens/trace/:tokenAddress/:chain/summary`

Get movement summary:

```json
{
  "totalTransfers": 5,
  "totalSwaps": 2,
  "totalBridges": 0,
  "uniqueLocations": 3,
  "firstAcquisition": "2024-01-01T00:00:00Z",
  "lastMovement": "2024-03-14T12:30:00Z",
  "currentLocation": "0xuser..."
}
```

---

## 🔄 Data Flow

### Wallet Scanning Flow

```
User clicks "Scan Wallet"
    ↓
WalletsController.scanWallet()
    ↓
WalletScannerService.scanWalletBalance()
    ↓
EtherscanService.getTokenTransfers() [Fetch all transfers]
    ↓
EtherscanService.getEthBalance() [Fetch native coin]
    ↓
PricesService.getLatestPrice() [Get current prices]
    ↓
Return array of TokenBalance[] with calculated values
    ↓
Frontend displays holdings in wallet
```

### Token Tracing Flow

```
User enters token address
    ↓
TokenTracerController.traceToken()
    ↓
TokenTracerService.traceToken() [Build journey]
    ↓
WalletScannerService.getTokenTransactionHistory()
    ↓
EtherscanService.getTokenTransfers() [Fetch history]
    ↓
Build complete trace with: step, action, addresses, amounts, timestamps
    ↓
formatTraceAsTable() [Format for Excel-like display]
    ↓
Frontend renders journey table with blockchain links
```

---

## 🎯 Supported Chains

### Etherscan (EVM Chains)

| Chain | API | Base URL |
|-------|-----|----------|
| Ethereum | Etherscan | https://api.etherscan.io/api |
| Polygon | Polygonscan | https://api.polygonscan.com/api |
| Arbitrum | Arbiscan | https://api.arbiscan.io/api |
| Base | Basescan | https://api.basescan.org/api |
| Optimism | Optimistic Etherscan | https://api-optimistic.etherscan.io/api |

### Configuration in Code

Each chain maps to its respective API:

```typescript
private getBaseUrl(chain: string): string {
  switch (chain.toLowerCase()) {
    case 'polygon':
      return this.polygonBaseUrl;
    case 'arbitrum':
      return this.arbiscanUrl;
    case 'base':
      return this.basescanUrl;
    case 'optimism':
      return this.optimismUrl;
    case 'ethereum':
    default:
      return this.baseUrl;
  }
}
```

---

## 💡 Usage Examples

### Frontend - Scan a Wallet

```typescript
import api from '../services/api';

const handleScan = async (walletId: string) => {
  try {
    const response = await api.scanWallet(walletId);
    console.log('Holdings:', response.data);
    // Update UI with holdings
  } catch (error) {
    console.error('Scan failed:', error);
  }
};
```

### Frontend - Trace a Token

```typescript
const handleTraceToken = async (tokenAddress: string, chain: string) => {
  try {
    const tableData = await api.getTokenTraceAsTable(tokenAddress, chain);
    const summary = await api.getTraceSummary(tokenAddress, chain);
    
    // Display journey table
    renderTable(tableData.data);
    // Display summary stats
    renderSummary(summary.data);
  } catch (error) {
    console.error('Trace failed:', error);
  }
};
```

### Backend - Custom Analysis

```typescript
import { EtherscanService } from './etherscan.service';

@Injectable()
export class CustomAnalysisService {
  constructor(private etherscan: EtherscanService) {}

  async analyzeWallet(address: string) {
    // Get all tokens
    const tokens = await this.etherscan.getTokenBalances(address);
    
    // Get all transactions
    const txs = await this.etherscan.getTokenTransfers(address);
    
    // Analyze patterns
    const swapCount = this.detectSwaps(txs);
    const bridgeCount = this.detectBridges(txs);
    
    return {
      tokenCount: tokens.length,
      transactionCount: txs.length,
      estimatedSwaps: swapCount,
      estimatedBridges: bridgeCount,
    };
  }
}
```

---

## ⚠️ Rate Limits & Best Practices

### Free Tier Limits
- **5 calls/second**
- **100,000 calls/day**
- Each balance check = 1 call
- Each token transfer fetch = 1 call per 10,000 txs

### Optimization Tips

1. **Batch Requests**: Fetch multiple tokens in one request when possible
2. **Caching**: Cache results for 1-5 minutes
3. **Pagination**: Use page/offset for large result sets
4. **Off-Peak Times**: Schedule heavy scans during off-peak hours
5. **Upgrade if Needed**: Consider paid API for high-volume usage

### Current Implementation Caching

```typescript
// PricesService caches prices for 1 minute
const priceData = await this.pricesService.getLatestPrice(symbol);

// Additional caching layer can be added:
const cacheKey = `wallet:${address}:${chain}`;
const cached = await this.cache.get(cacheKey);
if (cached) return cached;
```

---

## 🐛 Troubleshooting

### "Invalid API Key"
- Check `.env` file has correct key
- Verify key is active in Etherscan dashboard
- Try regenerating key if needed

### "Rate limit exceeded"
- Free tier: 5 calls/second max
- Implement exponential backoff retry
- Consider upgrading to paid API tier

### "Token not found"
- Verify contract address is correct
- Check address is on specified chain
- Some tokens may not have complete history on Etherscan

### "Transaction history incomplete"
- Etherscan API may return paginated results
- Implement pagination for large token histories
- Historical data is immutable once confirmed

---

## 📊 Monitoring

### Health Check Example

```bash
curl -X GET http://localhost:3000/api/health
```

### API Usage Tracking

Add to backend logging:

```typescript
private logApiCall(method: string, params: string) {
  console.log(`[Etherscan] ${method} - ${params} - ${new Date()}`);
}
```

---

## 🔄 Future Enhancements

- [ ] Support for non-EVM chains (Solana, Bitcoin)
- [ ] DEX swap detection with Uniswap Graph
- [ ] Bridge tracking with multi-chain APIs
- [ ] Historical price data for P&L calculations
- [ ] Real-time WebSocket updates for price changes
- [ ] NFT tracking and valuation
- [ ] Lending protocol tracking (Aave, Compound)

---

## 📚 Resources

- **Etherscan API Docs**: https://docs.etherscan.io/
- **Polygonscan API**: https://wiki.polygon.technology/docs/develop/tools/indexer
- **Getting an API Key**: https://etherscan.io/apis
- **Rate Limit Docs**: https://docs.etherscan.io/general/rate-limits

---

## 📝 License

This integration guide is part of the Tracker v7 project and follows the same license.
