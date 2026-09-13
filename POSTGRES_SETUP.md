# PostgreSQL Setup Guide

## Quick Start with Docker (Recommended)

### Option 1: Using docker-compose (full stack)
If you want to run the entire stack:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL 15 on port 5432 (username: tracker, password: tracker_password)
- Redis 7 on port 6379
- Backend on port 3000
- Frontend on port 3001

### Option 2: PostgreSQL only (for development)

Run just PostgreSQL without the full stack:

```bash
docker run --name tracker-postgres \
  -e POSTGRES_USER=tracker \
  -e POSTGRES_PASSWORD=tracker_password \
  -e POSTGRES_DB=tracker_v7 \
  -p 5432:5432 \
  -d postgres:15
```

Then start the backend with:
```bash
cd backend
npm install
npm run start:dev
```

### Option 3: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

1. Create database:
```sql
createdb tracker_v7
```

2. Create user:
```sql
createuser tracker
```

3. Set password:
```sql
psql -c "ALTER USER tracker WITH PASSWORD 'tracker_password'"
```

4. Grant privileges:
```sql
psql -d tracker_v7 -c "GRANT ALL PRIVILEGES ON DATABASE tracker_v7 to tracker"
```

## Verify Connection

Once PostgreSQL is running, test the connection:

```bash
psql -h localhost -U tracker -d tracker_v7 -c "SELECT version();"
```

## Start Backend & Frontend

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## Seed Demo User (Optional)

After backend is running:

```bash
cd backend
npm run seed
```

This creates a demo account:
- Email: demo@tracker.com
- Password: Demo12345
