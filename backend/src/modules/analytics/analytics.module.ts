import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Position } from '../positions/entities/position.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Position, Wallet])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
