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
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=tracker
DB_PASSWORD=tracker_password
DB_NAME=tracker_v7
JWT_SECRET=tracker_v7_dev_secret_key_1234567890_change_in_prod
REDIS_HOST=redis
REDIS_PORT=6379
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:3000
```

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
