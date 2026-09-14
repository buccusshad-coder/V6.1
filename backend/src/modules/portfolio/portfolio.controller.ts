import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from '../../guards/jwt.guard';

@Controller('portfolio')
@UseGuards(JwtGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('overview')
  async getOverview(@Request() req) {
    return this.portfolioService.getPortfolioOverview(req.user.userId);
  }

  @Get('by-wallet')
  async getByWallet(@Request() req) {
    return this.portfolioService.getPortfolioByWallet(req.user.userId);
  }

  @Get('analytics')
  async getAnalytics(@Request() req) {
    return this.portfolioService.getPortfolioAnalytics(req.user.userId);
  }

  @Get('pnl')
  async getPnL(@Request() req) {
    return this.portfolioService.getPortfolioPnL(req.user.userId);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.portfolioService.getPortfolioHistory(req.user.userId);
  }
}
