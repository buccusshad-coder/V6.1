import { Module } from '@nestjs/common';
import { EtherscanService } from './etherscan.service';
import { AlchemyService } from './alchemy.service';
import { HeliusService } from './helius.service';
import { PriceProviderService } from './price-provider.service';

@Module({
  providers: [EtherscanService, AlchemyService, HeliusService, PriceProviderService],
  exports: [EtherscanService, AlchemyService, HeliusService, PriceProviderService],
})
export class IntegrationsModule {}
