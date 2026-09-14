import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Position } from '../positions/entities/position.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
  ) {}

  async create(userId: string, createWalletDto: CreateWalletDto) {
    const existingWallet = await this.walletsRepository.findOne({
      where: {
        userId,
        address: createWalletDto.address,
        chain: createWalletDto.chain,
      },
    });

    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this chain');
    }

    const wallet = this.walletsRepository.create({
      userId,
      ...createWalletDto,
      type: createWalletDto.type || 'evm',
    });

    return await this.walletsRepository.save(wallet);
  }

  async findAll(userId: string) {
    return await this.walletsRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async update(id: string, userId: string, updateWalletDto: UpdateWalletDto) {
    await this.findOne(id, userId);

    await this.walletsRepository.update(
      { id, userId },
      updateWalletDto,
    );

    return await this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.walletsRepository.update(
      { id, userId },
      { isActive: false },
    );

    return { message: 'Wallet deleted successfully' };
  }

  async getWalletsByChain(userId: string, chain: string) {
    return await this.walletsRepository.find({
      where: { userId, chain, isActive: true },
    });
  }

  async getWalletPerformance(userId: string) {
    const wallets = await this.walletsRepository.find({
      where: { userId, isActive: true },
    });

    const performance = await Promise.all(
      wallets.map(async (wallet) => {
        const positions = await this.positionsRepository.find({
          where: { walletId: wallet.id },
        });

        const totalValue = positions.reduce((sum, p) => sum + (p.amount * p.currentPrice), 0);
        const totalCost = positions.reduce((sum, p) => sum + (p.amount * p.entryPrice), 0);
        const pnl = totalValue - totalCost;
        const roi = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

        return {
          walletId: wallet.id,
          walletName: wallet.name,
          chain: wallet.chain,
          address: wallet.address,
          totalValue: parseFloat(totalValue.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          pnl: parseFloat(pnl.toFixed(2)),
          roi: parseFloat(roi.toFixed(2)),
          positionCount: positions.length,
        };
      }),
    );

    return performance;
  }
}
