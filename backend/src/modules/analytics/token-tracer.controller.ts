import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TokenTracerService } from './token-tracer.service';
import { JwtGuard } from '../../guards/jwt.guard';

@Controller('tokens')
@UseGuards(JwtGuard)
export class TokenTracerController {
  constructor(private readonly tokenTracerService: TokenTracerService) {}

  @Get('trace/:tokenAddress/:chain')
  async traceToken(
    @Request() req,
    @Param('tokenAddress') tokenAddress: string,
    @Param('chain') chain: string,
  ) {
    const walletAddress = req.user.userId;
    const trace = await this.tokenTracerService.traceToken(
      walletAddress,
      tokenAddress,
      chain,
    );
    return trace;
  }

  @Get('trace/:tokenAddress/:chain/table')
  async traceTokenAsTable(
    @Request() req,
    @Param('tokenAddress') tokenAddress: string,
    @Param('chain') chain: string,
  ) {
    const walletAddress = req.user.userId;
    const trace = await this.tokenTracerService.traceToken(
      walletAddress,
      tokenAddress,
      chain,
    );
    return this.tokenTracerService.formatTraceAsTable(trace);
  }

  @Get('trace/:tokenAddress/:chain/summary')
  async getTraceSummary(
    @Request() req,
    @Param('tokenAddress') tokenAddress: string,
    @Param('chain') chain: string,
  ) {
    const walletAddress = req.user.userId;
    const trace = await this.tokenTracerService.traceToken(
      walletAddress,
      tokenAddress,
      chain,
    );
    return this.tokenTracerService.summarizeMovements(trace);
  }
}
