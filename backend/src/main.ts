import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware - configure helmet to not block CORS
  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'https://tracker-v7.vercel.app',
      ];
  console.log('🔓 CORS Origins:', corsOrigins);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API version prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tracker v7 API')
    .setDescription('Multi-chain portfolio tracking API')
    .setVersion('7.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('wallets', 'Wallet management')
    .addTag('positions', 'Position tracking')
    .addTag('prices', 'Price data')
    .addTag('portfolio', 'Portfolio analytics')
    .addTag('transactions', 'Transaction history')
    .addTag('alerts', 'Alert management')
    .addTag('notifications', 'Notification settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✅ Tracker v7 API running on port ${port}`);
  console.log(`📖 API Docs: http://localhost:${port}/docs`);
}

bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
