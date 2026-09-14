import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtGuard } from '../../guards/jwt.guard';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

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
