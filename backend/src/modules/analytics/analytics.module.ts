import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TokenTracerService } from './token-tracer.service';
import { TokenTracerController } from './token-tracer.controller';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Position } from '../positions/entities/position.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { PricesModule } from '../prices/prices.module';
import { IntegrationsModule } from '../../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Position, Wallet]),
    WalletsModule,
    PricesModule,
    IntegrationsModule,
  ],
  controllers: [AnalyticsController, TokenTracerController],
  providers: [AnalyticsService, TokenTracerService],
})
export class AnalyticsModule {}
