import { Module } from '@nestjs/common';
import { EtherscanService } from './etherscan.service';
import { HeliusService } from './helius.service';
import { PriceProviderService } from './price-provider.service';

@Module({
  providers: [EtherscanService, HeliusService, PriceProviderService],
  exports: [EtherscanService, HeliusService, PriceProviderService],
})
export class IntegrationsModule {}
