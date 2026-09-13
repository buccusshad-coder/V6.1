# Tracker v7.0 - Quick Reference

Fast lookup for common commands and patterns.

## 🚀 Start Development

### All-in-one (with Docker):
```bash
cd tracker-v7
cp .env.example .env
docker-compose up -d
```

### Manual (3 terminals):
```bash
# Terminal 1: Backend
cd backend && npm install && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm install && npm start

# Terminal 3: Mobile (optional)
cd mobile && npm install && npm start
```

---

## 📦 Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Mobile
cd mobile && npm install
```

---

## 🗄️ Database

### Run migrations:
```bash
cd backend
npm run typeorm migration:generate -- -n DescriptiveName
npm run migration:run
```

### Reset database (caution):
```bash
cd backend
npm run migration:revert
```

### View database:
```bash
psql -U tracker -d tracker_v7
\dt              # Show tables
\d table_name    # Show table structure
SELECT COUNT(*) FROM table_name;
\q               # Quit
```

---

## 🔧 Common Backend Tasks

### Create a new module:
```bash
# 1. Create directory
mkdir -p backend/src/modules/feature

# 2. Create files using the template:
# - feature.entity.ts
# - feature.service.ts
# - feature.controller.ts
# - dto/create-feature.dto.ts
# - feature.module.ts

# 3. Import in app.module.ts
# 4. Add to TypeOrmModule.forFeature([...])
```

### Test an endpoint:
```bash
# 1. Start backend: npm run start:dev
# 2. Visit: http://localhost:3000/docs
# 3. Click "Try it out"
# 4. Enter parameters
# 5. Click "Execute"
```

### Check logs:
```bash
# With Docker
docker-compose logs -f backend

# Terminal output shows everything
```

---

## 💻 Common Frontend Tasks

### Install a package:
```bash
cd frontend
npm install package-name
npm install -D dev-package-name
```

### Create a new page:
```bash
# 1. Create file: src/pages/NewPage.tsx
# 2. Add to App.tsx Routes
# 3. Add to GETTING_STARTED.md
```

### Test API integration:
```typescript
// Use the api service
import api from '@/services/api';

const data = await api.getWallets();
console.log(data);
```

### Fix styling:
```bash
# Edit src/App.css for component styles
# Edit src/index.css for global styles
# Or use Tailwind classes in JSX
```

---

## 🚨 Troubleshooting

### Port already in use:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 npm run start:dev
```

### Database connection error:
```bash
# Check PostgreSQL is running
psql -U postgres

# Check .env has correct values
cat .env | grep DB_

# If wrong, reset and restart Docker
docker-compose down
docker volume rm tracker-v7_postgres_data
docker-compose up -d
```

### Module not found error:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Weird errors after code change:
```bash
# Restart the dev server
# Press Ctrl+C to stop
# npm run start:dev to restart
```

---

## 📝 Code Patterns

### Service (Backend):
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(FeatureEntity)
    private repo: Repository<FeatureEntity>,
  ) {}

  async create(dto: CreateFeatureDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll() {
    return this.repo.find();
  }
}
```

### Controller (Backend):
```typescript
@ApiTags('features')
@Controller('features')
@UseGuards(JwtGuard)
export class FeatureController {
  constructor(private readonly service: FeatureService) {}

  @Post()
  create(@Body() dto: CreateFeatureDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

### React Component (Frontend):
```typescript
import React, { useEffect, useState } from 'react';
import api from '@/services/api';

export default function Feature() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFeatures()
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### Backend unit test:
```bash
cd backend
npm test -- feature.service
```

### Frontend test:
```bash
cd frontend
npm test -- Feature.test.tsx
```

---

## 🚢 Deployment

### Deploy Backend (Railway):
```bash
# 1. Create Railway account
# 2. Connect GitHub
# 3. Set environment variables
# 4. Deploy
```

### Deploy Frontend (Vercel):
```bash
# 1. Create Vercel account
# 2. Import project from GitHub
# 3. Set build command: npm run build
# 4. Set output: build
# 5. Deploy
```

---

## 📊 Monitoring

### View API request logs:
```bash
# Backend will log all requests
# Check terminal output
```

### Monitor database:
```bash
# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public';
```

### Monitor Redis:
```bash
redis-cli
> INFO
> KEYS *
> GET key_name
```

---

## 🔑 Environment Variables

### Essential for local development:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tracker
DB_PASSWORD=tracker_password
DB_NAME=tracker_v7

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-here

COINGECKO_API_KEY=free

REACT_APP_API_URL=http://localhost:3000/api
```

### For notifications:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=123456:ABC...
SENDGRID_API_KEY=SG.xxxxx...
```

---

## 📚 File Locations

```
Config:              backend/src/config/
Guards & Auth:       backend/src/guards/
Validation:          backend/src/pipes/
Entities:            backend/src/modules/*/...entity.ts
Services:            backend/src/modules/*/...service.ts
Controllers:         backend/src/modules/*/...controller.ts
DTOs:                backend/src/modules/*/dto/
Migrations:          backend/database/migrations/
Frontend Pages:      frontend/src/pages/
API Client:          frontend/src/services/api.ts
State Management:    frontend/src/store/
```

---

## ⚡ Performance Tips

1. **Database**: Add indexes on frequently queried columns
2. **Redis**: Cache API responses for 5-10 minutes
3. **Frontend**: Lazy load pages with React.lazy()
4. **Images**: Optimize images before upload
5. **Queries**: Use pagination for large datasets
6. **WebSocket**: Don't emit events too frequently

---

## 🔐 Security Tips

1. Never commit .env file
2. Use environment variables for secrets
3. Validate all user input
4. Use HTTPS in production
5. Keep dependencies updated: `npm audit`
6. Use strong JWT_SECRET (32+ characters)
7. Rate limit API endpoints
8. Use CORS properly

---

## 💡 Quick Commands

```bash
# View all files
find . -type f | head -20

# Count lines of code
find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l

# Format code
npm run format

# Check for errors
npm run lint

# Git status
git status

# Git commit
git add .
git commit -m "feat: description"
```

---

## 📞 Get Help

1. Check **GETTING_STARTED.md** for setup issues
2. Read **IMPLEMENTATION_CHECKLIST.md** for what to build next
3. See **V7_DEVELOPMENT_PLAN.md** for technical specs
4. Check NestJS docs: https://docs.nestjs.com
5. Check React docs: https://react.dev

---

## 🎯 Current Phase

Start here: **Phase 1 - Backend Core**

Follow: **IMPLEMENTATION_CHECKLIST.md**

Estimated time: 1 week per phase

---

Good luck! 🚀
