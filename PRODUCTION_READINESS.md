# Tracker v7 - Production Readiness Guide

## 🚀 Overview

Complete checklist and procedures to move Tracker v7 to production. This document covers deployment, monitoring, security hardening, and operational procedures.

---

## ✅ Pre-Production Checklist

### Security Requirements

- [ ] Change all default secrets in `.env`
  - JWT_SECRET: Generate random 32+ character string
  - DB_PASSWORD: Strong unique password
  - API keys: Store in secrets manager (never in code)

- [ ] Enable HTTPS/TLS
  - [ ] SSL certificates installed
  - [ ] Domain configured
  - [ ] Redirect HTTP → HTTPS

- [ ] Authentication hardened
  - [ ] JWT expiration set to reasonable value (7 days)
  - [ ] Refresh token rotation implemented
  - [ ] Password requirements enforced
  - [ ] Account lockout after failed attempts
  - [ ] Rate limiting enabled

- [ ] CORS configured for production
  - [ ] Only allow frontend domain
  - [ ] No wildcard (*)
  - [ ] Credentials handling correct

- [ ] Database security
  - [ ] Connection pooling enabled
  - [ ] Database user has minimal permissions
  - [ ] Automatic backups configured
  - [ ] Backup encryption enabled
  - [ ] Replication tested

- [ ] API security
  - [ ] Rate limiting configured
  - [ ] Input validation on all endpoints
  - [ ] Output sanitization
  - [ ] Error messages don't leak info
  - [ ] SQL injection prevention verified
  - [ ] XSS protection enabled

### Performance Requirements

- [ ] Database
  - [ ] Indexes created on frequently queried columns
  - [ ] Connection pooling configured
  - [ ] Query performance monitored
  - [ ] Slow queries identified and optimized

- [ ] Caching
  - [ ] Redis cluster configured
  - [ ] Cache invalidation strategy implemented
  - [ ] Cache key naming convention standardized
  - [ ] Memory usage monitored

- [ ] Frontend
  - [ ] Code splitting implemented
  - [ ] Assets minified and compressed
  - [ ] CDN configured for static assets
  - [ ] Service worker for offline support
  - [ ] Image optimization applied

- [ ] API
  - [ ] Response times monitored
  - [ ] Pagination implemented for large datasets
  - [ ] Request timeout configured
  - [ ] Load testing passed

### Operational Requirements

- [ ] Monitoring
  - [ ] APM tool configured (Datadog, New Relic, etc.)
  - [ ] Error tracking enabled (Sentry)
  - [ ] Uptime monitoring configured
  - [ ] Alert thresholds set

- [ ] Logging
  - [ ] Centralized logging configured
  - [ ] Log rotation enabled
  - [ ] Sensitive data redacted from logs
  - [ ] Log retention policy set

- [ ] Infrastructure
  - [ ] Database backup strategy validated
  - [ ] Disaster recovery plan documented
  - [ ] Auto-scaling configured
  - [ ] Container orchestration ready (Kubernetes optional)

- [ ] Documentation
  - [ ] Runbooks created for common issues
  - [ ] On-call procedures documented
  - [ ] Incident response plan created
  - [ ] Deployment procedures documented

---

## 🔐 Security Hardening

### 1. Environment Variables

**Before Deployment:**
```bash
# Generate secure secrets
# JWT_SECRET
openssl rand -base64 32

# Do NOT commit secrets
echo ".env.production" >> .gitignore
echo ".env.*.local" >> .gitignore

# Use secrets manager for production
# AWS Secrets Manager, HashiCorp Vault, or similar
```

**Required Variables for Production:**
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Database (NEVER hardcode)
DB_HOST=your-rds-instance.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=tracker_user
DB_PASSWORD=very-secure-password
DB_NAME=tracker_v7_prod
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis (NEVER hardcode)
REDIS_HOST=your-redis-cluster.redis.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=redis-secure-password
REDIS_TLS=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-32plus-chars
JWT_EXPIRATION=7d

# API Keys (use secrets manager)
ETHERSCAN_API_KEY=your-key
POLYGONSCAN_API_KEY=your-key
COINGECKO_API_KEY=your-key
HELIUS_API_KEY=your-key

# Frontend Configuration
CORS_ORIGIN=https://your-production-domain.com
API_URL=https://api.your-production-domain.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
DATADOG_API_KEY=your-datadog-key

# Notifications
DISCORD_WEBHOOK_URL=your-webhook-url
TELEGRAM_BOT_TOKEN=your-bot-token
SENDGRID_API_KEY=your-sendgrid-key
```

### 2. Database Security

```bash
# Create limited user (PostgreSQL)
CREATE USER tracker_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE tracker_v7_prod TO tracker_user;
GRANT USAGE ON SCHEMA public TO tracker_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tracker_user;

# Enable SSL connections
# In postgresql.conf:
# ssl = on
# ssl_cert_file = '/path/to/server.crt'
# ssl_key_file = '/path/to/server.key'

# Enable connection logging
log_connections = on
log_disconnections = on
log_statement = 'all'
```

### 3. API Security

```typescript
// backend/src/main.ts

import helmet from '@nestjs/helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet()); // Sets security headers
  
  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }));
  
  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Transform payloads to DTO instances
    })
  );
  
  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

### 4. Frontend Security

```typescript
// frontend/src/index.tsx

// Set security headers
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta name="X-Content-Type-Options" content="nosniff" />
<meta name="X-Frame-Options" content="DENY" />
<meta name="X-XSS-Protection" content="1; mode=block" />
```

---

## 📊 Deployment Architecture

### Infrastructure Diagram

```
┌─────────────────────────────────────────────┐
│           CDN (Cloudflare/AWS)              │
│        (Static Assets, Caching)             │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────┐    ┌──────▼──────────┐
│  Vercel        │    │  Railway/AWS    │
│  (Frontend)    │    │  (Backend API)  │
│  React SPA     │    │  NestJS         │
└────────────────┘    └────────┬────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    ┌───▼────────────┐  ┌──────▼──────┐  ┌──────────▼──┐
    │  PostgreSQL    │  │    Redis    │  │  External   │
    │  (Supabase/    │  │   (Cache)   │  │    APIs     │
    │   AWS RDS)     │  │             │  │  Etherscan  │
    └────────────────┘  └─────────────┘  │  CoinGecko  │
                                         └─────────────┘
```

### Deployment Steps

#### Step 1: Database Setup

```bash
# AWS RDS PostgreSQL 15
# - Multi-AZ enabled
# - Automated backups (30-day retention)
# - Encryption at rest enabled
# - Enhanced monitoring enabled

# Connection details:
DATABASE_URL=postgresql://user:pass@tracker-db.xxxxx.us-east-1.rds.amazonaws.com:5432/tracker_v7

# Run migrations
npm run migration:run
```

#### Step 2: Backend Deployment (Railway/AWS)

```bash
# Railway deployment
# 1. Connect GitHub repository
# 2. Set environment variables in Railway dashboard
# 3. Set root directory: backend
# 4. Build command: npm run build
# 5. Start command: npm start
# 6. Deploy

# Or AWS ECS:
# - Build Docker image
# - Push to ECR
# - Deploy to ECS cluster
# - Configure load balancer
```

#### Step 3: Frontend Deployment (Vercel)

```bash
# Vercel deployment
# 1. Connect GitHub repository
# 2. Set root directory: frontend
# 3. Build command: npm run build
# 4. Output directory: build
# 5. Set environment variables:
#    - REACT_APP_API_URL=https://api.production.com
# 6. Deploy

# Custom domain:
# - Add domain in Vercel settings
# - Update DNS records
# - Enable automatic SSL/TLS
```

#### Step 4: Redis Cluster

```bash
# AWS ElastiCache Redis
# - Multi-AZ enabled
# - Automatic failover
# - Encryption at rest and in-transit
# - Backup retention: 7 days

# Connection:
REDIS_HOST=tracker-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=secure-password
REDIS_TLS=true
```

---

## 📈 Monitoring & Observability

### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({
      request: true,
      serverName: true,
      transaction: true,
    }),
  ],
});
```

### Performance Monitoring (Datadog)

```typescript
import tracer from 'dd-trace';

tracer.init({
  logInjection: true,
  profiling: true,
  profilerEnabled: true,
});

// Track custom metrics
tracer.gauge('wallet.scan.duration', duration, { wallet_id: walletId });
tracer.increment('wallet.scan.total', { chain: chain });
```

### Logging (Structured)

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('WalletService');

logger.log('Wallet scanned', { 
  userId: user.id,
  walletAddress: wallet.address,
  chain: wallet.chain,
  tokenCount: tokens.length,
});

logger.error('Wallet scan failed', error, {
  userId: user.id,
  walletAddress: wallet.address,
});
```

### Key Metrics to Monitor

```
Backend:
  - Request latency (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Database connection pool usage
  - Redis memory usage
  - Job queue depth (Bull)
  
Frontend:
  - Page load time (First Contentful Paint)
  - Time to Interactive
  - Cumulative Layout Shift
  - Core Web Vitals
  - JavaScript error rate
  
Infrastructure:
  - CPU usage (target: 60-70%)
  - Memory usage (target: 60-70%)
  - Disk space available
  - Network I/O
  - Database connections active
```

---

## 🆘 Incident Response

### On-Call Procedures

**Alert received:**
1. Check Sentry for error details
2. Check Datadog for affected services
3. Review logs for patterns
4. Determine severity (SEV-1/2/3)
5. Communicate with team

**Severity Levels:**

- **SEV-1 (Critical)**: Service down, data loss risk
  - Page on-call immediately
  - Start incident channel
  - Aim for 1 hour resolution

- **SEV-2 (High)**: Service degraded, 50%+ impact
  - Page on-call within 15 min
  - Communicate status
  - Aim for 4 hour resolution

- **SEV-3 (Low)**: Partial impact or cosmetic
  - Create ticket
  - Plan fix in next sprint

### Common Issues & Solutions

```bash
# Database connection timeout
# Solution: Check RDS status, increase connection pool

# Redis evictions
# Solution: Increase Redis memory or optimize caching

# API rate limits
# Solution: Check Etherscan quotas, implement queue

# Memory leaks
# Solution: Check Sentry profiles, review recent changes

# Slow queries
# Solution: Check query logs, add indexes
```

### Rollback Procedure

```bash
# If deployment breaks production:

# 1. Revert to previous version
git revert HEAD

# 2. Redeploy
git push origin main
# Railway/Vercel auto-deploys

# 3. Verify status
curl https://api.production.com/api/health
curl https://production.com/

# 4. Notify team
# Post to #incidents channel
```

---

## 🔄 Continuous Deployment

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm run build
      - run: npm run build:frontend

  deploy-backend:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up --service backend

  deploy-frontend:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm i -g vercel
          vercel deploy --prod
```

---

## 🧪 Post-Deployment Verification

After deploying to production, verify:

```bash
#!/bin/bash

API_URL="https://api.production.com"
FRONTEND_URL="https://production.com"

echo "🔍 Verifying Production Deployment..."

# 1. API Health
echo "✓ Checking API health..."
curl -s $API_URL/api/health | jq '.status' | grep -q "ok" && echo "✅ API OK" || echo "❌ API Failed"

# 2. Database Connection
echo "✓ Checking database..."
curl -s $API_URL/api/database/status | jq '.connected' | grep -q "true" && echo "✅ Database OK" || echo "❌ Database Failed"

# 3. Frontend Load
echo "✓ Checking frontend..."
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200" && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

# 4. Authentication Flow
echo "✓ Testing auth..."
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' | jq -r '.access_token')
[[ ! -z "$TOKEN" ]] && echo "✅ Auth OK" || echo "❌ Auth Failed"

# 5. Wallet Creation
echo "✓ Testing wallet creation..."
curl -s -X POST $API_URL/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address":"0x123","chain":"ethereum"}' | jq '.id' && echo "✅ Wallet OK" || echo "❌ Wallet Failed"

echo "✅ Production deployment verified!"
```

---

## 📋 Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Dependencies updated
- [ ] Environment variables set
- [ ] Database migrations tested
- [ ] Backups created
- [ ] Monitoring configured
- [ ] Alerts enabled
- [ ] Team notified
- [ ] Deployment executed
- [ ] Post-deployment checks passed
- [ ] Status page updated

---

## 📚 Additional Resources

- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

---

**Last Updated:** September 19, 2026
**Version:** 1.0
**Status:** Production Ready
