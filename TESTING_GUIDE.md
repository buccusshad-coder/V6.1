# Tracker v7 - Complete Testing Guide

## 📋 Overview

This guide provides comprehensive testing procedures for all components of Tracker v7 before production deployment. Follow these procedures to validate functionality across all layers.

---

## 🚀 Pre-Testing Setup

### 1. Environment Preparation

```bash
# Clone repository
git clone https://github.com/your-repo/tracker-v7.git
cd tracker-v7

# Setup environment variables
cp .env.example .env

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL (via Docker or local)
docker-compose up -d postgres

# Run migrations
cd backend
npm run migration:run

# Seed test data (optional)
npm run seed
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Mobile (optional)
cd mobile && npm start
```

---

## ✅ Phase 1: Backend API Testing

### 1.1 Health Checks

```bash
# Test backend health
curl http://localhost:3000/api/health
# Expected: { "status": "ok", "timestamp": "2026-09-19T..." }

# Check database connection
curl http://localhost:3000/api/database/status
# Expected: { "connected": true, "database": "tracker_v7" }

# Check Redis connection
curl http://localhost:3000/api/cache/status
# Expected: { "connected": true, "cache": "redis" }
```

### 1.2 Authentication Flow

```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tracker.com",
    "password": "Test123!",
    "password_confirmation": "Test123!"
  }'
# Expected: { "id": "user-123", "email": "test@tracker.com", "createdAt": "..." }

# 2. Login user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tracker.com",
    "password": "Test123!"
  }'
# Expected: { "access_token": "eyJhbGc...", "refresh_token": "...", "expiresIn": 604800 }

# 3. Get profile with token
TOKEN="eyJhbGc..."
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "id": "user-123", "email": "test@tracker.com", "createdAt": "..." }

# 4. Test token refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refresh_token": "..." }'
# Expected: { "access_token": "new-token...", "expiresIn": 604800 }
```

### 1.3 Wallet Management

```bash
TOKEN="your-token-here"

# 1. Create wallet
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890abcdef",
    "chain": "ethereum",
    "label": "Main Wallet"
  }'
# Expected: { "id": "wallet-123", "address": "0x1234567890...", "chain": "ethereum", "balance": "0" }

# 2. List wallets
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "data": [ { "id": "wallet-123", ... } ], "total": 1 }

# 3. Get single wallet
curl -X GET http://localhost:3000/api/wallets/wallet-123 \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "id": "wallet-123", "address": "0x1234567890...", ... }

# 4. Update wallet
curl -X PUT http://localhost:3000/api/wallets/wallet-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "label": "Updated Label" }'
# Expected: { "id": "wallet-123", "label": "Updated Label", ... }

# 5. Delete wallet
curl -X DELETE http://localhost:3000/api/wallets/wallet-123 \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "message": "Wallet deleted successfully" }
```

### 1.4 Position Tracking

```bash
TOKEN="your-token-here"

# 1. Create position
curl -X POST http://localhost:3000/api/positions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "wallet-123",
    "symbol": "ETH",
    "amount": "2.5",
    "entry_price": "2000",
    "entry_date": "2026-01-01",
    "chain": "ethereum"
  }'
# Expected: { "id": "pos-123", "symbol": "ETH", "amount": "2.5", "pnl": "..." }

# 2. List positions
curl -X GET http://localhost:3000/api/positions \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "data": [ { "id": "pos-123", "symbol": "ETH", ... } ], "total": 1 }

# 3. Update position
curl -X PUT http://localhost:3000/api/positions/pos-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "amount": "3.0" }'
# Expected: { "id": "pos-123", "amount": "3.0", ... }

# 4. Delete position
curl -X DELETE http://localhost:3000/api/positions/pos-123 \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "message": "Position deleted successfully" }
```

### 1.5 Wallet Scanning (Etherscan Integration)

```bash
TOKEN="your-token-here"

# Scan wallet for all holdings
curl -X POST http://localhost:3000/api/wallets/wallet-123/scan \
  -H "Authorization: Bearer $TOKEN"
# Expected: [
#   {
#     "symbol": "ETH",
#     "name": "Ethereum",
#     "amount": "1.5",
#     "value": 3000,
#     "address": "0x0000000000000000000000000000000000000000"
#   },
#   ...
# ]
```

### 1.6 Price Endpoints

```bash
TOKEN="your-token-here"

# 1. Get current prices
curl -X GET "http://localhost:3000/api/prices?symbols=BTC,ETH,USDC" \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "BTC": { "price": "...", "change24h": "..." }, ... }

# 2. Get price history
curl -X GET "http://localhost:3000/api/prices/history/ETH?days=7" \
  -H "Authorization: Bearer $TOKEN"
# Expected: [ { "date": "2026-09-12", "price": "2000", ... }, ... ]
```

### 1.7 Portfolio Analytics

```bash
TOKEN="your-token-here"

# 1. Get portfolio overview
curl -X GET http://localhost:3000/api/portfolio/overview \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "totalValue": "...", "totalCost": "...", "unrealizedPnL": "...", "roi": "..." }

# 2. Get portfolio analytics
curl -X GET http://localhost:3000/api/analytics/portfolio \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "metrics": { "sharpeRatio": "...", "sortino": "...", ... }, ... }

# 3. Get chain distribution
curl -X GET http://localhost:3000/api/analytics/chain-distribution \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "ethereum": 50, "polygon": 30, "arbitrum": 20 }
```

### 1.8 Alerts System

```bash
TOKEN="your-token-here"

# 1. Create price alert
curl -X POST http://localhost:3000/api/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "price",
    "symbol": "ETH",
    "condition": "above",
    "target_value": "3000",
    "is_active": true
  }'
# Expected: { "id": "alert-123", "symbol": "ETH", "condition": "above", ... }

# 2. List alerts
curl -X GET http://localhost:3000/api/alerts \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "data": [ { "id": "alert-123", ... } ], "total": 1 }

# 3. Update alert
curl -X PUT http://localhost:3000/api/alerts/alert-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "is_active": false }'
# Expected: { "id": "alert-123", "is_active": false, ... }

# 4. Delete alert
curl -X DELETE http://localhost:3000/api/alerts/alert-123 \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "message": "Alert deleted successfully" }
```

---

## ✅ Phase 2: Frontend Testing

### 2.1 Page Load Tests

Open browser and navigate to `http://localhost:3001`:

```
✅ Login page loads
✅ Register page loads
✅ No JavaScript errors in console
✅ All assets loaded (CSS, JS, images)
✅ Responsive on mobile/tablet/desktop
```

### 2.2 Authentication Flow

```
1. Click Register
   ✅ Registration form appears
   ✅ All fields validate
   ✅ Email validation works
   ✅ Password strength indicator shows

2. Enter test data
   - Email: test@tracker.com
   - Password: Test123!
   - Confirm: Test123!

3. Click Register
   ✅ Form submits
   ✅ Loading spinner appears
   ✅ Redirects to dashboard after success
   ✅ Token stored in localStorage
```

### 2.3 Dashboard Navigation

```
✅ Dashboard page loads
✅ Portfolio value displays
✅ Charts render correctly
✅ All navigation links work
✅ Top navigation menu responsive
✅ Mobile menu (hamburger) works
```

### 2.4 Wallets Page

```
1. Click Wallets tab
   ✅ Wallets list loads
   ✅ Add wallet button visible
   ✅ Wallet cards display correctly

2. Click "Add Wallet"
   ✅ Modal/form appears
   ✅ Address input field works
   ✅ Chain dropdown shows all options
   ✅ Submit button functional

3. Add test wallet
   - Address: 0x1234567890abcdef
   - Chain: Ethereum
   ✅ Wallet added to list
   ✅ Displays in portfolio

4. Click "Scan Wallet"
   ✅ Loading state shows
   ✅ Holdings load from blockchain
   ✅ Tokens display with amounts
   ✅ Values calculate correctly
```

### 2.5 Holdings Page

```
1. Click Holdings tab
   ✅ Positions list loads
   ✅ Add position button visible
   ✅ Columns: Symbol, Amount, Entry, Current, P&L

2. Add position
   - Symbol: ETH
   - Amount: 2.5
   - Entry Price: $2000
   ✅ Position added
   ✅ Current price fetches
   ✅ P&L calculates

3. Test sorting
   ✅ Click column headers
   ✅ Sort ascending/descending works
   ✅ Responsive on mobile
```

### 2.6 Portfolio Page

```
✅ Charts load (Price Chart, Distribution)
✅ Metrics display (Total Value, P&L, ROI)
✅ Chain breakdown shows pie chart
✅ Symbol breakdown shows bar chart
✅ Time period selector works (1D, 1W, 1M, etc.)
```

### 2.7 Alerts Page

```
1. Click Alerts tab
   ✅ Alert list displays

2. Create new alert
   - Symbol: ETH
   - Type: Price
   - Condition: Above $3000
   ✅ Alert created
   ✅ Shows in list
   ✅ Status updates when triggered

3. Edit alert
   ✅ Click edit icon
   ✅ Modal updates values
   ✅ Save works

4. Delete alert
   ✅ Delete confirmation appears
   ✅ Alert removed from list
```

### 2.8 Responsive Design

Test on multiple screen sizes:

```
Desktop (1920x1080):
  ✅ All content visible
  ✅ No horizontal scroll
  ✅ Charts render full width

Tablet (768x1024):
  ✅ Layout adapts
  ✅ Navigation collapses
  ✅ Touch interactions work

Mobile (375x667):
  ✅ Hamburger menu appears
  ✅ Single column layout
  ✅ Buttons large enough
  ✅ No content overflow
```

---

## ✅ Phase 3: Real-Time Features Testing

### 3.1 WebSocket Connection

```bash
# Monitor browser console for connection logs
# Open Developer Tools (F12) → Console

Expected logs:
✅ Socket.io connected message
✅ Connected to namespace /prices
✅ Event listeners active for price updates
```

### 3.2 Price Updates

```
1. Open portfolio page
2. Watch price chart
3. Wait 60 seconds (price update interval)

Expected:
✅ Prices update automatically
✅ Chart updates in real-time
✅ P&L values recalculate
✅ Portfolio value updates
```

### 3.3 Connection Resilience

```
1. Disable network (DevTools → Network tab → Offline)
2. Wait 10 seconds
3. Re-enable network

Expected:
✅ Reconnection message in console
✅ Data syncs when reconnected
✅ No data loss
✅ Exponential backoff visible in logs
```

---

## ✅ Phase 4: Mobile App Testing (React Native/Expo)

### 4.1 Android Emulator

```bash
# Start Android emulator
cd mobile
npm start
# Press 'a' to open Android emulator

Expected:
✅ App loads in emulator
✅ Splash screen appears
✅ Navigation stack initializes
✅ No red error screens
```

### 4.2 iOS Simulator

```bash
# Start iOS simulator
npm start
# Press 'i' to open iOS simulator

Expected:
✅ App loads in simulator
✅ Navigates smoothly
✅ Touches register events
✅ No yellow warnings
```

### 4.3 Mobile Auth Flow

```
1. App loads
2. See Login screen
   ✅ Email input field works
   ✅ Password input works
   ✅ Login button responsive

3. Tap Register
   ✅ Navigate to Register screen
   ✅ All form fields visible
   ✅ Keyboard appears for inputs

4. Fill form
   - Email: mobile@tracker.com
   - Password: Test123!
   - Confirm: Test123!
   ✅ Tapping submit works
   ✅ Loading indicator shows
   ✅ Navigate to app after success
```

### 4.4 Mobile Dashboard

```
✅ Bottom tab navigation shows 6 tabs
✅ Each tab navigates correctly
✅ Portfolio value displays
✅ Charts render on mobile viewport
✅ Touchable areas large enough
```

### 4.5 Mobile Wallets Tab

```
✅ Wallet list scrolls
✅ Add wallet button works
✅ Scan wallet triggers Etherscan API
✅ Results display in formatted list
✅ Pull-to-refresh works
```

### 4.6 Mobile Responsiveness

```
Landscape orientation:
  ✅ Layout adapts
  ✅ Navigation still accessible
  ✅ Charts resize appropriately

Portrait orientation:
  ✅ Single column layout
  ✅ Scrolling works
  ✅ Buttons accessible
```

---

## ✅ Phase 5: Database Integrity Testing

### 5.1 Data Persistence

```bash
# Insert test data
INSERT INTO users (email, password) VALUES ('persist@test.com', 'hash...');

# Stop backend
# Stop PostgreSQL

# Restart both
# Verify data still exists

✅ Data persisted across restarts
✅ Relationships maintained
✅ No data corruption
```

### 5.2 Transaction Atomicity

```bash
# Create transaction with multiple operations
curl -X POST http://localhost:3000/api/transactions/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      { "type": "buy", "symbol": "ETH", "amount": "1", "price": "2000" },
      { "type": "sell", "symbol": "BTC", "amount": "0.5", "price": "45000" }
    ]
  }'

# Kill database mid-operation (if testing)
✅ Either all operations complete or all rollback
✅ No partial transactions
```

### 5.3 Constraint Validation

```bash
# Test unique constraint
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890abcdef",
    "chain": "ethereum"
  }'
# First time: ✅ Success
# Second time: ✅ Error (unique constraint)

# Test foreign key
# Delete user with positions in database
# Expected: ✅ Error or cascade delete depending on config
```

---

## ✅ Phase 6: Performance Testing

### 6.1 API Response Times

```bash
# Benchmark endpoints
time curl http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN"

✅ Response time < 100ms
✅ Database queries optimized
✅ No N+1 queries
```

### 6.2 Load Testing

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:3000/api/health

✅ Handles concurrent requests
✅ No memory leaks
✅ Connection pooling works
```

### 6.3 Frontend Bundle Size

```bash
# Check production build
cd frontend
npm run build

✅ Bundle size < 500KB gzipped
✅ No unused dependencies
✅ Code splitting working
```

---

## ✅ Phase 7: Security Testing

### 7.1 Authentication Security

```bash
# Test without token
curl -X GET http://localhost:3000/api/auth/profile
# Expected: ✅ 401 Unauthorized

# Test with invalid token
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid-token"
# Expected: ✅ 401 Unauthorized

# Test with expired token
# Wait for JWT expiration
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer expired-token"
# Expected: ✅ 401 Unauthorized
```

### 7.2 Password Security

```bash
# Test weak password
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123"}'
# Expected: ✅ Error - password too weak

# Test password hashing
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "secure@test.com",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!"
  }'
# In database: ✅ Password is hashed (not plaintext)
```

### 7.3 CORS Configuration

```bash
# Test from different origin
curl -X GET http://localhost:3000/api/health \
  -H "Origin: https://attacker.com"
# Expected: ✅ Request allowed or blocked per config
```

### 7.4 SQL Injection Prevention

```bash
# Test SQL injection attempt
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com\" OR \"1\"=\"1",
    "password": "anything"
  }'
# Expected: ✅ No error, treated as literal string
```

---

## ✅ Phase 8: Integration Testing

### 8.1 End-to-End User Flow

```
1. Register new user
   ✅ Account created
   ✅ Confirmation email (if enabled)
   ✅ Can login immediately

2. Login
   ✅ Token received
   ✅ Stored in localStorage
   ✅ Redirects to dashboard

3. Add wallet
   ✅ Wallet saved to database
   ✅ Displayed in wallet list
   ✅ Associated with user

4. Scan wallet
   ✅ Calls Etherscan API
   ✅ Fetches token balances
   ✅ Calculates values with prices
   ✅ Displays in portfolio

5. Create alert
   ✅ Alert saved
   ✅ Condition tracked
   ✅ Triggers when met

6. Monitor portfolio
   ✅ Prices update in real-time
   ✅ P&L recalculates
   ✅ Charts update
```

### 8.2 Multi-User Isolation

```bash
# Create 2 users
USER1="user1@test.com"
USER2="user2@test.com"

# User 1 creates wallet
TOKEN1=$(login $USER1)
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xaaa","chain":"ethereum"}'

# User 2 tries to access User 1's wallet
TOKEN2=$(login $USER2)
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN2"

✅ User 2 cannot see User 1's wallets
✅ Each user sees only their own data
```

---

## 🧪 Automated Testing Commands

### Run All Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests
```

### Run Frontend Tests

```bash
cd frontend
npm test                   # Run all tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
```

---

## 📊 Testing Checklist

Print this checklist and mark items as tested:

```
Phase 1: Backend
  [ ] Health checks pass
  [ ] Auth flow works (register, login, profile)
  [ ] Wallets CRUD operations
  [ ] Positions CRUD operations
  [ ] Wallet scanning (Etherscan)
  [ ] Price endpoints
  [ ] Portfolio analytics
  [ ] Alerts system

Phase 2: Frontend
  [ ] Pages load correctly
  [ ] Authentication works
  [ ] Dashboard displays data
  [ ] Wallets management works
  [ ] Holdings tracking works
  [ ] Portfolio page responsive
  [ ] Alerts creation/management
  [ ] Responsive design (desktop, tablet, mobile)

Phase 3: Real-Time
  [ ] WebSocket connects
  [ ] Prices update automatically
  [ ] Connection resilience tested
  [ ] No data loss on reconnect

Phase 4: Mobile
  [ ] Android emulator works
  [ ] iOS simulator works
  [ ] Auth flow on mobile
  [ ] All tabs navigable
  [ ] Responsive to orientation

Phase 5: Database
  [ ] Data persists across restarts
  [ ] Transactions are atomic
  [ ] Constraints enforced
  [ ] User isolation verified

Phase 6: Performance
  [ ] API response times < 100ms
  [ ] Handles concurrent requests
  [ ] Bundle size optimized
  [ ] No memory leaks

Phase 7: Security
  [ ] Auth required for protected routes
  [ ] Invalid tokens rejected
  [ ] SQL injection prevented
  [ ] CORS configured
  [ ] Passwords hashed

Phase 8: Integration
  [ ] End-to-end flow works
  [ ] Multi-user isolation confirmed
  [ ] Error handling verified
  [ ] UI handles edge cases
```

---

## 🔍 Troubleshooting During Testing

### Backend won't start
```bash
# Check logs
npm run start:dev 2>&1 | grep -i error

# Verify PostgreSQL running
docker ps | grep postgres

# Check environment variables
cat .env | grep DB_
```

### Frontend blank page
```bash
# Check console errors (F12)
# Clear cache: npm cache clean --force
# Rebuild: npm run build
# Check API connection in Network tab
```

### API returns 401
```bash
# Token might be expired
# Get new token via login
# Verify token format: "Bearer {token}"
# Check Authorization header case-sensitivity
```

### Database connection error
```bash
# Verify PostgreSQL credentials
psql -U tracker -h localhost -d tracker_v7

# Check connection pooling
# Review backend logs for connection errors
```

---

## ✅ Sign-Off

Once all tests pass, fill in the sign-off:

```
Date: ___________
Backend: ___________
Frontend: ___________
Mobile: ___________
DevOps: ___________
QA Lead: ___________
Product Manager: ___________
```

---

**Last Updated:** September 19, 2026
**Version:** 1.0
**Status:** Ready for Testing
