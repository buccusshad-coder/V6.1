import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from '../../guards/jwt.guard';

@Controller('portfolio')
@UseGuards(JwtGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('overview')
  async getOverview(@Request() req) {
    return this.portfolioService.getPortfolioOverview(req.user.sub);
  }

  @Get('analytics')
  async getAnalytics(@Request() req) {
    return this.portfolioService.getPortfolioAnalytics(req.user.sub);
  }

  @Get('pnl')
  async getPnL(@Request() req) {
    return this.portfolioService.getPortfolioPnL(req.user.sub);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.portfolioService.getPortfolioHistory(req.user.sub);
  }
}
