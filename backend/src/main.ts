import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['*'];
  console.log('🔓 CORS Origins:', corsOrigins);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
