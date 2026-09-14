import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesGateway } from './prices.gateway';
import { PricesController } from './prices.controller';

@Module({
  controllers: [PricesController],
  providers: [PricesService, PricesGateway],
  exports: [PricesService],
})
export class PricesModule {}
