# DevOps & Deployment Guide - Phase 2

## 📦 Docker & Container Management

### Build Backend Docker Image
```bash
docker build -t tracker-v7-backend:latest ./backend
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend (port 3000)
- Frontend (port 3001)

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### Automated Testing
The pipeline in `.github/workflows/ci-cd.yml`:
1. **On every push & PR**: Runs linting and build
2. **On main branch push**: Deploys to Replit (backend) and Vercel (frontend)

### Local Testing
```bash
# Run tests
cd backend && npm test

# Run e2e tests
npm run test:e2e
```

---

## 💾 Database Backups

### Supabase Automatic Backups
- **Daily automated backups** to Supabase (included)
- Retention: 30 days
- Access via Supabase dashboard

### Manual Backup
```bash
pg_dump tracker_v7 > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup
```bash
psql tracker_v7 < backup_20260914_120000.sql
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Backend**: `GET /api/health` (to be added)
- **Database**: Docker health check (pg_isready)
- **Redis**: Docker health check (redis-cli ping)

### Docker Health Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🚀 Deployment URLs

| Service | URL |
|---------|-----|
| Backend | https://baf2e3de-ace0-4de9-8e32-c8877aaaac79-00-ahpajri5pzwf.kira.replit.dev |
| Database | https://gtoaodsjozlwbpbwklkb.supabase.co |
| Frontend | https://tracker-v6-nz242.vercel.app |

---

## 🔐 Environment Variables

### Backend (.env)
```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=tracker
DB_PASSWORD=tracker_password
DB_NAME=tracker_v7

# JWT
JWT_SECRET=tracker_v7_dev_secret_key_1234567890_change_in_prod

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# External APIs - Blockchain Data
ETHERSCAN_API_KEY=your-etherscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key
ALCHEMY_API_KEY=your-alchemy-api-key
HELIUS_API_KEY=your-helius-api-key

# Price Data
COINGECKO_API_KEY=optional-coingecko-api-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:3000
```

---

## 🔗 External API Setup

### Etherscan Integration (Wallet Scanning)
1. **Register at [Etherscan.io](https://etherscan.io)**
2. **Get Free API Key**: No payment required for free tier
3. **Free Limits**: 5 calls/second, 100,000 calls/day
4. **Set in .env**: `ETHERSCAN_API_KEY=your-key-here`

### Polygonscan Integration (Polygon Chain)
1. **Register at [Polygonscan.com](https://polygonscan.com)**
2. **Get Free API Key**: Same as Etherscan
3. **Set in .env**: `POLYGONSCAN_API_KEY=your-key-here`

### Supported Chains
- ✅ **Ethereum** - via Etherscan API
- ✅ **Polygon** - via Polygonscan API
- ⏳ **Arbitrum** - via Arbiscan API (similar setup)
- ⏳ **Base** - via Basescan API (similar setup)
- ⏳ **Optimism** - via Optimistic Etherscan API (similar setup)

### What the Etherscan Integration Provides
1. **Real-time Token Balances** - Fetch all tokens held in a wallet
2. **Transaction History** - Get complete token transfer history
3. **Token Metadata** - Retrieve token name, symbol, decimals
4. **Swap Detection** - Analyze transaction patterns to identify swaps
5. **Gas Information** - Get current gas prices and historical data
6. **Balance Calculations** - Track token flow from history

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000  # Find process using port 3000
kill -9 <PID>  # Kill the process
```

### Docker Container Fails to Start
```bash
docker-compose logs backend
docker-compose down && docker-compose up --build
```

### Database Connection Issues
```bash
docker exec tracker-v7-postgres psql -U tracker -d tracker_v7 -c "\dt"
```

---

## 📋 Phase 2 Checklist

- ✅ Docker containerization
- ✅ GitHub Actions CI/CD pipeline
- ✅ E2E test setup
- ✅ Database backup strategy
- ⏳ Add health check endpoints
- ⏳ Add monitoring (Prometheus/Grafana)
- ⏳ Add logging aggregation (ELK stack)

---

Next: Phase 3 (Real-time features with WebSocket)
