import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { PositionsModule } from './modules/positions/positions.module';
import { PricesModule } from './modules/prices/prices.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IntegrationsModule } from './integrations/integrations.module';

import { TypeOrmConfigService } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'tracker_v7_dev_secret_key_1234567890_change_in_prod',
      signOptions: { expiresIn: '7d' },
    }),
    IntegrationsModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    PositionsModule,
    PricesModule,
    AlertsModule,
    NotificationsModule,
    PortfolioModule,
    TransactionsModule,
    AnalyticsModule,
  ],
  exports: [JwtModule],
})
export class AppModule {}
