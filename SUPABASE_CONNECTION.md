# Get Supabase Connection String (Fast)

## Direct Path to Connection String

1. **Log in** → https://supabase.com/dashboard
2. **Click your project** (tracker-v7 or whatever you named it)
3. **Left sidebar** → Click **"Settings"** (gear icon at bottom)
4. **Settings page** → Click **"Database"** tab
5. **Look for "Connection String"** section
6. **Copy the connection string** that looks like:
   ```
   postgresql://postgres.xxxxx:password@xxxxx.supabase.co:5432/postgres
   ```

## Extract These Values From Connection String

The format is: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

So from: `postgresql://postgres.xxxxx:abc123xyz@db.xxxxx.supabase.co:5432/postgres`

Extract:
- `DB_HOST` = `db.xxxxx.supabase.co`
- `DB_PORT` = `5432`
- `DB_USERNAME` = `postgres.xxxxx`
- `DB_PASSWORD` = `abc123xyz`
- `DB_NAME` = `postgres`

## Update .env

Edit `/home/sha/projets/tracker-v7/.env` and replace:
```
DB_HOST=your_host_here
DB_PORT=5432
DB_USERNAME=your_username_here
DB_PASSWORD=your_password_here
DB_NAME=postgres
DB_SYNC=true
```

## Then Run

```bash
cd /home/sha/projets/tracker-v7/backend
npm run seed
```

Done! ✅
