import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { WalletsGateway } from './wallets.gateway';
import { Wallet } from './entities/wallet.entity';
import { Position } from '../positions/entities/position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Position])],
  providers: [WalletsService, WalletsGateway],
  controllers: [WalletsController],
  exports: [WalletsService, WalletsGateway],
})
export class WalletsModule {}
