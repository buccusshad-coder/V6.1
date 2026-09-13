import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtGuard } from '../../guards/jwt.guard';
import { CreatePositionDto, UpdatePositionDto } from './dto';

@Controller('positions')
@UseGuards(JwtGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  create(@Request() req, @Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(req.user.userId, createPositionDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.positionsService.findAll(req.user.userId);
  }

  @Get('by-wallet/:walletId')
  findByWallet(@Request() req, @Param('walletId') walletId: string) {
    return this.positionsService.findByWallet(walletId, req.user.userId);
  }

  @Get('by-chain')
  getByChain(@Request() req) {
    return this.positionsService.getPositionsByChain(req.user.userId);
  }

  @Get('total-value')
  getTotalValue(@Request() req) {
    return this.positionsService.getTotalValue(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.positionsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionsService.update(id, req.user.userId, updatePositionDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.positionsService.remove(id, req.user.userId);
  }
}
