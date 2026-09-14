import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../guards/jwt.guard';

@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('portfolio')
  async getPortfolioAnalytics(@Request() req): Promise<any> {
    return await this.analyticsService.getPortfolioAnalytics(req.user.userId);
  }

  @Get('chain-distribution')
  async getChainDistribution(@Request() req): Promise<Record<string, number>> {
    return await this.analyticsService.getChainDistribution(req.user.userId);
  }

  @Get('symbol-distribution')
  async getSymbolDistribution(@Request() req): Promise<Record<string, number>> {
    return await this.analyticsService.getSymbolDistribution(req.user.userId);
  }

  @Get('performance')
  async getPerformanceMetrics(@Request() req): Promise<any> {
    return await this.analyticsService.getPerformanceMetrics(req.user.userId);
  }
}
