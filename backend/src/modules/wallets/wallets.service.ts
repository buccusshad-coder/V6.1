import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Position } from '../positions/entities/position.entity';
import { WalletsGateway } from './wallets.gateway';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    private walletsGateway: WalletsGateway,
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

    const savedWallet = await this.walletsRepository.save(wallet);
    this.walletsGateway.broadcastWalletCreated(userId, savedWallet);
    return savedWallet;
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

    const updatedWallet = await this.findOne(id, userId);
    this.walletsGateway.broadcastWalletUpdated(userId, updatedWallet);
    return updatedWallet;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.walletsRepository.update(
      { id, userId },
      { isActive: false },
    );

    this.walletsGateway.broadcastWalletDeleted(userId, id);
    return { message: 'Wallet deleted successfully', walletId: id };
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

  async getDeletedWallets(userId: string) {
    return await this.walletsRepository.find({
      where: { userId, isActive: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async restoreWallet(id: string, userId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.isActive) {
      throw new BadRequestException('Wallet is already active');
    }

    await this.walletsRepository.update(
      { id, userId },
      { isActive: true },
    );

    const restoredWallet = await this.findOne(id, userId);
    this.walletsGateway.broadcastWalletRestored(userId, restoredWallet);
    return restoredWallet;
  }
}
