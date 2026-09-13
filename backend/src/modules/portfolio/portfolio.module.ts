import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Position } from '../positions/entities/position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Position])],
  providers: [PortfolioService],
  controllers: [PortfolioController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
