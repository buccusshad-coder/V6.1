import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../guards/jwt.guard';

@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('portfolio')
  getPortfolioAnalytics(@Request() req) {
    return this.analyticsService.getPortfolioAnalytics(req.user.userId);
  }

  @Get('chain-distribution')
  getChainDistribution(@Request() req) {
    return this.analyticsService.getChainDistribution(req.user.userId);
  }

  @Get('symbol-distribution')
  getSymbolDistribution(@Request() req) {
    return this.analyticsService.getSymbolDistribution(req.user.userId);
  }

  @Get('performance')
  getPerformanceMetrics(@Request() req) {
    return this.analyticsService.getPerformanceMetrics(req.user.userId);
  }
}
