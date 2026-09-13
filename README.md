# Tracker v7.0

A production-ready multi-chain portfolio tracking application built with NestJS, React, and React Native.

## 🎯 Features

1. **Web Dashboard** - React-based portfolio overview with charts and analytics
2. **Mobile App** - React Native/Expo app for on-the-go portfolio tracking
3. **Multi-Chain Support** - Ethereum, Arbitrum, Base, Solana networks
4. **Price Tracking** - Real-time price updates via CoinGecko API
5. **Portfolio Analytics** - Sharpe ratio, Sortino ratio, ROI, drawdown analysis
6. **Alerts System** - Price alerts, threshold-based notifications
7. **Notifications** - Discord, Telegram, Email, In-app alerts
8. **Transaction History** - Blockchain transaction tracking and analysis
9. **Backtesting Engine** - Test strategies against historical data
10. **WebSocket Updates** - Real-time portfolio value and price updates
11. **Database Persistence** - PostgreSQL with TypeORM ORM
12. **Caching Layer** - Redis for performance optimization
13. **Job Queue** - Bull queue for background processing
14. **API Documentation** - Swagger/OpenAPI docs
15. **Authentication** - JWT with Passport.js
16. **Docker Setup** - Complete docker-compose for local development

## 🚀 Quick Start

```bash
# Clone and setup
cd tracker-v7
cp .env.example .env

# With Docker (recommended)
docker-compose up -d

# Check API docs
open http://localhost:3000/docs

# Or manual setup
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm start
```

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup instructions.

## 📁 Project Structure

```
tracker-v7/
├── backend/              # NestJS REST API
├── frontend/             # React web dashboard
├── mobile/               # React Native mobile app
├── docker-compose.yml    # Local development environment
├── .env.example          # Environment configuration template
└── docs/                 # Additional documentation
```

## 🔧 Tech Stack

**Backend:**
- NestJS - Progressive Node.js framework
- TypeORM - Object-relational mapping
- PostgreSQL - Relational database
- Redis - Caching and sessions
- Bull - Job queue processor
- Passport.js - Authentication
- Swagger - API documentation

**Frontend:**
- React 18 - UI framework
- Zustand - State management
- React Router - Routing
- TradingView Charts - Financial charts
- Recharts - Analytics charts
- Tailwind CSS - Styling

**Mobile:**
- React Native - Cross-platform mobile
- Expo - React Native tooling
- React Navigation - Mobile navigation
- React Native Paper - UI components

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Node.js 20

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/profile
```

### Wallets
```
GET    /api/wallets
POST   /api/wallets
GET    /api/wallets/:id
PUT    /api/wallets/:id
DELETE /api/wallets/:id
```

### Positions
```
GET    /api/positions
POST   /api/positions
GET    /api/positions/:id
DELETE /api/positions/:id
```

### Portfolio
```
GET    /api/portfolio/overview
GET    /api/portfolio/analytics
GET    /api/portfolio/pnl
GET    /api/portfolio/history
```

### Prices
```
GET    /api/prices
GET    /api/prices/:symbol
GET    /api/prices/history/:symbol
```

### Alerts
```
GET    /api/alerts
POST   /api/alerts
PUT    /api/alerts/:id
DELETE /api/alerts/:id
```

See [V7_DEVELOPMENT_PLAN.md](./V7_DEVELOPMENT_PLAN.md) for complete API specification.

## 🔑 Environment Variables

See [.env.example](./.env.example) for all available configuration options.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL
- `REDIS_HOST`, `REDIS_PORT` - Redis
- `JWT_SECRET` - JWT signing key
- `COINGECKO_API_KEY` - CoinGecko API key
- `DISCORD_WEBHOOK_URL` - Discord notifications
- `TELEGRAM_BOT_TOKEN` - Telegram bot
- `SENDGRID_API_KEY` - Email notifications

## 🛠️ Development

### Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Mobile
cd mobile && npm install
```

### Database Migrations
```bash
cd backend
npm run typeorm migration:generate -- -n MigrationName
npm run migration:run
```

### Run Development Servers
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Mobile (if needed)
cd mobile && npm start
```

### Build for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# Mobile
cd mobile && expo build
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📊 Database Schema

Main tables:
- `users` - User accounts
- `wallets` - User crypto wallets
- `positions` - Token holdings
- `transactions` - Blockchain transactions
- `price_history` - Historical price data
- `alerts` - Price alerts
- `notification_logs` - Alert notifications
- `portfolio_analytics` - Analytics snapshots

See [V7_DEVELOPMENT_PLAN.md](./V7_DEVELOPMENT_PLAN.md) for complete schema.

## 🚀 Deployment

### Backend (Railway/Render)
```bash
# Set environment variables on platform
# Deploy from GitHub
```

### Frontend (Vercel/Netlify)
```bash
# Connect to GitHub
# Auto-deploy on push
```

### Mobile (Expo/EAS)
```bash
eas build
eas submit
```

## 📖 Documentation

- [Getting Started Guide](./GETTING_STARTED.md)
- [Development Plan & Roadmap](./V7_DEVELOPMENT_PLAN.md)
- [API Documentation](http://localhost:3000/docs) (when running)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "feat: description"`
3. Push branch: `git push origin feature/name`
4. Create pull request

## 📝 License

MIT

## 🆘 Support

For issues and questions, check:
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Troubleshooting section
- NestJS docs: https://docs.nestjs.com
- React docs: https://react.dev
- TypeORM docs: https://typeorm.io

---

**Built with ❤️ for crypto portfolio tracking**
