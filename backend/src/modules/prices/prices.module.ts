import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesGateway } from './prices.gateway';
import { PricesController } from './prices.controller';
import { UniswapService } from '../../integrations/uniswap.service';

@Module({
  controllers: [PricesController],
  providers: [PricesService, PricesGateway, UniswapService],
  exports: [PricesService],
})
export class PricesModule {}
