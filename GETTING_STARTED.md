# Tracker v7.0 - Getting Started Guide

## ✅ What's Been Created

You now have a complete project skeleton with:
- ✅ Backend structure (NestJS)
- ✅ Frontend structure (React)
- ✅ Mobile structure (React Native/Expo)
- ✅ Docker Compose setup
- ✅ Environment configuration template
- ✅ Package dependencies defined
- ✅ Directory structure organized

## 🚀 Quick Start (5 minutes)

### Prerequisites
```bash
Node.js 20+
Docker & Docker Compose (optional, but recommended)
PostgreSQL 15+ (or use Docker)
Redis (or use Docker)
```

### Option A: With Docker (Recommended)
```bash
cd /home/sha/projets/tracker-v7

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

Visit:
- API: http://localhost:3000
- API Docs: http://localhost:3000/docs
- Frontend: http://localhost:3001

### Option B: Manual Setup

#### 1. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE USER tracker WITH PASSWORD 'tracker_password';
CREATE DATABASE tracker_v7 OWNER tracker;
\q
```

#### 2. Backend Setup
```bash
cd backend
cp ../.env.example .env

# Edit .env with your settings
nano .env

npm install
npm run migration:run
npm run start:dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:3000/api npm start
```

#### 4. Redis (Optional but recommended)
```bash
redis-server
```

---

## 📁 Project Structure

```
tracker-v7/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── config/         # Configuration
│   │   ├── guards/         # Auth guards
│   │   ├── pipes/          # Validation pipes
│   │   └── main.ts         # Entry point
│   ├── database/
│   │   ├── migrations/     # TypeORM migrations
│   │   └── seeds/          # Initial data
│   └── package.json
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   └── store/          # Zustand state
│   └── package.json
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation config
│   │   └── services/       # API clients
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml      # Development environment
└── .env.example           # Environment template
```

---

## 🔧 Implementation Roadmap

### Phase 1: Core Backend (Week 1)
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Create database migrations
- [ ] Implement User module (registration, login, profile)
- [ ] Implement Auth module (JWT strategy)
- [ ] Test auth endpoints in Swagger

**Commands:**
```bash
cd backend
npm install
npm run typeorm migration:generate -- -n CreateUsersTable
npm run migration:run
npm run start:dev
# Visit http://localhost:3000/docs
```

### Phase 2: Wallet & Position Modules (Week 2)
- [ ] Create Wallet module
- [ ] Create Position module
- [ ] Implement wallet CRUD operations
- [ ] Connect to CoinGecko for prices
- [ ] Create database seeder

**Files to create:**
```
backend/src/modules/
  wallets/
    ├── wallet.entity.ts
    ├── wallet.service.ts
    ├── wallet.controller.ts
    ├── dto/
    │   ├── create-wallet.dto.ts
    │   └── update-wallet.dto.ts
    └── wallet.module.ts
  
  positions/
    ├── position.entity.ts
    ├── position.service.ts
    ├── position.controller.ts
    └── position.module.ts
```

### Phase 3: Price & Analytics (Week 3)
- [ ] Create Prices module
- [ ] Implement price caching with Redis
- [ ] Create Analytics module
- [ ] Calculate Sharpe Ratio, Sortino Ratio
- [ ] Implement portfolio metrics

### Phase 4: Advanced Features (Week 4)
- [ ] Create Alerts module
- [ ] Implement Notifications (Discord, Email, Telegram)
- [ ] Create Transactions module
- [ ] Implement transaction syncing from blockchain

### Phase 5: Frontend Development (Week 5)
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Create layout and navigation
- [ ] Build portfolio dashboard
- [ ] Create wallet management pages
- [ ] Implement price charts

### Phase 6: Mobile & Final Polish (Week 6+)
- [ ] Create mobile app structure
- [ ] Build essential mobile screens
- [ ] Implement push notifications
- [ ] Deploy to Railway/Render

---

## 📚 Module Creation Template

### Create a new module:

**1. Entity** (`src/modules/example/example.entity.ts`)
```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('examples')
export class ExampleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**2. DTO** (`src/modules/example/dto/create-example.dto.ts`)
```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

**3. Service** (`src/modules/example/example.service.ts`)
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExampleEntity } from './example.entity';
import { CreateExampleDto } from './dto/create-example.dto';

@Injectable()
export class ExampleService {
  constructor(
    @InjectRepository(ExampleEntity)
    private repo: Repository<ExampleEntity>,
  ) {}

  async create(dto: CreateExampleDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOneBy({ id });
  }
}
```

**4. Controller** (`src/modules/example/example.controller.ts`)
```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExampleService } from './example.service';
import { CreateExampleDto } from './dto/create-example.dto';

@ApiTags('examples')
@Controller('examples')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Post()
  create(@Body() dto: CreateExampleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

**5. Module** (`src/modules/example/example.module.ts`)
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExampleEntity } from './example.entity';
import { ExampleService } from './example.service';
import { ExampleController } from './example.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExampleEntity])],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
```

---

## 🔑 Key API Endpoints (To Implement)

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
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
```

---

## 📦 Dependencies Installed

### Backend
- NestJS, TypeORM, PostgreSQL driver
- JWT, Passport for auth
- Bull for job queues
- Redis for caching
- Axios for HTTP requests
- Swagger for API docs

### Frontend
- React 18, React Router
- Zustand for state management
- React Hook Form for forms
- Recharts for basic charts
- TradingView Lightweight Charts
- Tailwind CSS (add manually)

### Mobile
- Expo and React Native
- React Navigation
- React Native Paper UI
- Same API clients as web

---

## 🧪 Testing

### Run backend tests
```bash
cd backend
npm test
```

### Run frontend tests
```bash
cd frontend
npm test
```

---

## 🚢 Deployment

### Deploy Backend to Railway
```bash
# 1. Create Railway account and connect git
# 2. Add environment variables
# 3. Set start command: npm run start:prod
# 4. Deploy
```

### Deploy Frontend to Vercel
```bash
# 1. Connect Vercel to GitHub
# 2. Set build command: npm run build
# 3. Set public directory: build
# 4. Deploy
```

---

## 📝 Next Steps

1. **Start with backend**: Complete Phase 1 (User & Auth modules)
2. **Set up database**: Run migrations
3. **Build out modules**: Follow the template above
4. **Test API**: Use Swagger docs at /docs
5. **Build frontend**: Start with dashboard
6. **Deploy**: Use Railway + Vercel

---

## 🆘 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run start:dev
```

### Database connection failed
```bash
# Check PostgreSQL is running
psql -U tracker -d tracker_v7

# Check .env file
cat .env
```

### Docker issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📞 Support

For detailed implementation, check:
- NestJS docs: https://docs.nestjs.com
- TypeORM docs: https://typeorm.io
- React docs: https://react.dev
- TailwindCSS: https://tailwindcss.com

Happy coding! 🚀
