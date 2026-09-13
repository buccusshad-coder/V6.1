const { createConnection } = require('typeorm');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDemoUser() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USERNAME || 'tracker',
      password: process.env.DB_PASSWORD || 'tracker_password',
      database: process.env.DB_NAME || 'tracker_v7',
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true,
    });

    const hashedPassword = await bcrypt.hash('Demo12345', 10);
    const userId = uuidv4();
    const now = new Date();

    const userRepo = connection.getRepository('User');
    const existingUser = await userRepo.findOne({ where: { email: 'demo@tracker.com' } });

    if (existingUser) {
      console.log('✅ Demo user already exists');
    } else {
      await userRepo.save({
        id: userId,
        email: 'demo@tracker.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('✅ Demo user created successfully!');
      console.log('📧 Email: demo@tracker.com');
      console.log('🔐 Password: Demo12345');
    }

    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedDemoUser();
