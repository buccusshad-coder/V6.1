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
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtGuard } from '../../guards/jwt.guard';
import { CreateTransactionDto, UpdateTransactionDto } from './dto';

@Controller('transactions')
@UseGuards(JwtGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.transactionsService.findAll(req.user.userId);
  }

  @Get('recent')
  getRecent(@Request() req, @Query('limit') limit: number = 10) {
    return this.transactionsService.getRecentTransactions(req.user.userId, limit);
  }

  @Get('by-wallet/:walletId')
  findByWallet(@Request() req, @Param('walletId') walletId: string) {
    return this.transactionsService.findByWallet(walletId, req.user.userId);
  }

  @Get('by-position/:positionId')
  findByPosition(@Request() req, @Param('positionId') positionId: string) {
    return this.transactionsService.findByPosition(positionId, req.user.userId);
  }

  @Get('by-type/:type')
  getByType(@Request() req, @Param('type') type: string) {
    return this.transactionsService.getTransactionsByType(
      req.user.userId,
      type as 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake',
    );
  }

  @Get('total-volume')
  getTotalVolume(@Request() req) {
    return this.transactionsService.getTotalVolume(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.transactionsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, req.user.userId, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.transactionsService.remove(id, req.user.userId);
  }
}
