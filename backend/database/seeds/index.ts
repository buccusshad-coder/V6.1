import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../src/modules/auth/entities/user.entity';

const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('DB_HOST:', process.env.DB_HOST);

const host = process.env.DB_HOST || 'localhost';
const enableSsl = host.includes('supabase');

const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'tracker',
  password: process.env.DB_PASSWORD || 'tracker_password',
  database: process.env.DB_NAME || 'tracker_v7',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  ssl: enableSsl ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const existingUser = await userRepository.findOne({ where: { email: 'demo@tracker.com' } });

  if (existingUser) {
    console.log('✅ Demo user already exists');
    await AppDataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('Demo12345', 10);

  const demoUser = userRepository.create({
    email: 'demo@tracker.com',
    password: hashedPassword,
    firstName: 'Demo',
    lastName: 'User',
    isActive: true,
  });

  await userRepository.save(demoUser);
  console.log('✅ Demo user created successfully!');
  console.log('📧 Email: demo@tracker.com');
  console.log('🔐 Password: Demo12345');

  await AppDataSource.destroy();
}

seedDatabase().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
