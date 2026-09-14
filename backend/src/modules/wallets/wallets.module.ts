import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { WalletsGateway } from './wallets.gateway';
import { WalletScannerService } from './wallet-scanner.service';
import { Wallet } from './entities/wallet.entity';
import { Position } from '../positions/entities/position.entity';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { PricesModule } from '../prices/prices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Position]),
    IntegrationsModule,
    PricesModule,
  ],
  providers: [WalletsService, WalletsGateway, WalletScannerService],
  controllers: [WalletsController],
  exports: [WalletsService, WalletsGateway, WalletScannerService],
})
export class WalletsModule {}
