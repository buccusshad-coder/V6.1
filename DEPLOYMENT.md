# Tracker v7 - Cloud Deployment Guide

Complete guide to deploy Tracker v7 to Vercel (Frontend) and Railway (Backend).

---

## 🚀 Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account with repo access

### Step 1: Connect GitHub to Vercel
1. Go to https://vercel.com
2. Click **Import Project**
3. Connect your GitHub account
4. Select the `tracker-v7` repository

### Step 2: Configure Frontend Deployment
1. **Framework Preset**: React
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`

### Step 3: Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_API_URL = https://your-backend-url.com/api
```

### Step 4: Deploy
Click **Deploy** → Vercel builds and deploys automatically

**Frontend URL Example**: `https://tracker-v7.vercel.app`

---

## 🚀 Backend Deployment (Railway)

### Prerequisites
- Railway account (free at https://railway.app)
- GitHub connected

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Click **New Project**
3. Select **GitHub Repo**
4. Choose your `tracker-v7` repo

### Step 2: Add PostgreSQL Database
1. In Railway → **Add Service**
2. Select **PostgreSQL**
3. Railway creates database automatically

### Step 3: Configure Backend Service
1. Click **New Service**
2. Select **GitHub Repo**
3. Select `tracker-v7` repo
4. Set **Root Directory**: `backend`

### Step 4: Set Environment Variables
In Railway → Your Service → Variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_SYNC=true
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRATION=7d
ETHERSCAN_API_KEY=your-etherscan-key
HELIUS_API_KEY=your-helius-key
COINGECKO_API_KEY=your-coingecko-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key
CORS_ORIGIN=https://tracker-v7.vercel.app
```

### Step 5: Deploy
Railway automatically deploys on every GitHub push

**Backend URL Example**: `https://tracker-v7-backend.up.railway.app`

---

## 🔗 Connect Frontend to Backend

Update `frontend/.env.production`:
```
REACT_APP_API_URL=https://tracker-v7-backend.up.railway.app/api
```

Or update Vercel environment variable with your Railway backend URL.

---

## ✅ Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway with PostgreSQL
- [ ] Environment variables set correctly
- [ ] Frontend can connect to backend API
- [ ] User registration works
- [ ] Wallet creation works
- [ ] Portfolio loads without errors
- [ ] Token tracing endpoint responds

---

## 🧪 Test Deployment

```bash
# Test backend is running
curl https://your-backend-url.com/api/auth/profile

# Test frontend loads
curl https://your-vercel-url.com

# Test complete flow (register + fetch wallets)
curl -X POST https://your-backend-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tracker.com","password":"Test123!","password_confirmation":"Test123!"}'
```

---

## 📊 Alternative Deployment Options

### Heroku (Backend)
1. `heroku create tracker-v7-backend`
2. `heroku buildpacks:add heroku/nodejs --app tracker-v7-backend`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
4. Set env vars: `heroku config:set KEY=value`
5. `git push heroku main`

### AWS (Full Stack)
- Frontend: AWS S3 + CloudFront
- Backend: AWS EC2 + RDS PostgreSQL
- Requires more configuration but more scalable

### DigitalOcean (Full Stack)
- App Platform with PostgreSQL
- Docker containerization
- More affordable long-term

---

## 🔐 Security Best Practices

1. **Change JWT Secret**: Never use default secret in production
   ```
   JWT_SECRET=your-very-long-random-secret-string-here
   ```

2. **Secure API Keys**: Store API keys in environment variables, never in code

3. **CORS Configuration**: Only allow your frontend domain
   ```
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Database Credentials**: Use Railway/Cloud database, never hardcode

5. **HTTPS Only**: Both frontend and backend must use HTTPS

---

## 📈 Monitoring & Logs

### Vercel
- Dashboard shows deployment history
- Logs tab shows real-time logs
- Analytics shows traffic

### Railway
- Metrics tab shows CPU, memory, disk
- Logs tab shows service logs
- Deployments tab shows history

---

## 💡 Troubleshooting

### Frontend 404 on refresh
- Vercel is configured for React Router
- All routes redirect to index.html

### Backend connection refused
- Check CORS_ORIGIN is set correctly
- Verify backend is running (`curl https://api-url.com/api/health`)

### Database connection error
- Verify DB credentials in environment variables
- Check PostgreSQL service is running on Railway

### API key errors
- Verify all API keys are set correctly
- Check Etherscan, Helius, CoinGecko keys are valid

---

## 🎉 You're Live!

Once deployed:
- Frontend: Open your Vercel URL
- Backend: Accessible at Railway URL
- Database: PostgreSQL on Railway
- APIs: All endpoints live

Users can now access your app globally! 🚀
