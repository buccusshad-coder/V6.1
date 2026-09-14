import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { WalletScannerService, TokenBalance } from './wallet-scanner.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtGuard } from '../../guards/jwt.guard';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(
    private walletsService: WalletsService,
    private walletScannerService: WalletScannerService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createWalletDto: CreateWalletDto) {
    if (!createWalletDto.name || !createWalletDto.address || !createWalletDto.chain) {
      throw new BadRequestException('Missing required fields: name, address, chain');
    }
    return await this.walletsService.create(req.user.userId, createWalletDto);
  }

  @Get('performance')
  async getPerformance(@Request() req) {
    return await this.walletsService.getWalletPerformance(req.user.userId);
  }

  @Get('deleted/all')
  async getDeleted(@Request() req) {
    return await this.walletsService.getDeletedWallets(req.user.userId);
  }

  @Post(':id/restore')
  async restore(@Request() req, @Param('id') id: string) {
    return await this.walletsService.restoreWallet(id, req.user.userId);
  }

  @Post(':id/scan')
  async scanWallet(@Request() req, @Param('id') id: string): Promise<any> {
    try {
      console.log(`🔍 Scanning wallet ${id} for user ${req.user.userId}`);

      const wallet = await this.walletsService.findOne(id, req.user.userId);
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      console.log(`📡 Fetching token balances for ${wallet.address} on ${wallet.chain}...`);
      const holdings = await this.walletScannerService.scanWalletBalance(wallet.address, wallet.chain);

      console.log(`✅ Found ${holdings.length} tokens`);

      // Calculate total value and save holdings to metadata
      const totalValue = holdings.reduce((sum, token) => sum + (token.value || 0), 0);

      console.log(`💾 Saving wallet with balance ${totalValue} and ${holdings.length} holdings...`);

      // Only store top tokens in metadata to avoid exceeding field size limits
      // Sort by value (descending) and take top 100
      // Include all tokens regardless of value (prices might not be available yet)
      const significantHoldings = holdings
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 100);

      const updateData: any = {
        balance: Number(totalValue.toFixed(2)),
        metadata: {
          holdings: significantHoldings,
          holdingsSummary: {
            total: holdings.length,
            significant: significantHoldings.length,
            totalValue: Number(totalValue.toFixed(2))
          },
          scannedAt: new Date().toISOString(),
        }
      };

      await this.walletsService.update(id, req.user.userId, updateData);

      console.log(`✅ Wallet saved successfully`);

      return {
        success: true,
        holdings,
        totalValue: Number(totalValue.toFixed(2)),
        tokenCount: holdings.length,
        scannedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error scanning wallet:`, error);
      throw new BadRequestException(
        `Failed to scan wallet: ${error.message || 'Unknown error'}`
      );
    }
  }

  @Get('chain/:chain')
  async getByChain(@Request() req, @Param('chain') chain: string) {
    return await this.walletsService.getWalletsByChain(req.user.userId, chain);
  }

  @Get()
  async findAll(@Request() req) {
    return await this.walletsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return await this.walletsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return await this.walletsService.update(id, req.user.userId, updateWalletDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return await this.walletsService.remove(id, req.user.userId);
  }
}
