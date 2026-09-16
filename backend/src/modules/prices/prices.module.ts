import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesGateway } from './prices.gateway';
import { PricesController } from './prices.controller';
import { DefilamaService } from '../../integrations/defilama.service';

@Module({
  controllers: [PricesController],
  providers: [PricesService, PricesGateway, DefilamaService],
  exports: [PricesService],
})
export class PricesModule {}
