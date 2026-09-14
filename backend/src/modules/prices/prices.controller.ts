import { Controller, Get, Param } from '@nestjs/common';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get(':symbol')
  async getPrice(@Param('symbol') symbol: string) {
    return this.pricesService.getLatestPrice(symbol);
  }

  @Get(':symbol/history/:days')
  async getPriceHistory(
    @Param('symbol') symbol: string,
    @Param('days') days: string,
  ) {
    return this.pricesService.getPriceHistory(symbol, parseInt(days, 10));
  }

  @Get('multiple/:symbols')
  async getMultiplePrices(@Param('symbols') symbols: string) {
    const symbolArray = symbols.split(',');
    return this.pricesService.getMultiplePrices(symbolArray);
  }
}
