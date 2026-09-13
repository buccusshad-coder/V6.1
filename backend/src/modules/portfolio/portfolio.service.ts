import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Position } from '../positions/entities/position.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
  ) {}

  async getPortfolioOverview(userId: string) {
    const positions = await this.positionRepository.find({
      where: { userId, isActive: true },
    });

    const totalValue = positions.reduce(
      (sum, pos) =>
        sum + parseFloat(pos.amount.toString()) * parseFloat(pos.currentPrice?.toString() || '0'),
      0,
    );

    const totalCost = positions.reduce(
      (sum, pos) =>
        sum + parseFloat(pos.amount.toString()) * parseFloat(pos.entryPrice?.toString() || '0'),
      0,
    );

    const dayChange = totalValue - totalCost;
    const dayChangePercent = totalCost > 0 ? (dayChange / totalCost) * 100 : 0;

    return {
      totalValue,
      dayChange,
      dayChangePercent,
      allTimeReturn: dayChangePercent,
    };
  }

  async getPortfolioAnalytics(userId: string) {
    const wallets = await this.walletRepository.find({
      where: { userId, isActive: true },
    });

    const byChain = {};
    wallets.forEach((wallet) => {
      if (!byChain[wallet.chain]) {
        byChain[wallet.chain] = 0;
      }
      byChain[wallet.chain] += parseFloat(wallet.balance.toString());
    });

    return { byChain, totalWallets: wallets.length };
  }

  async getPortfolioPnL(userId: string) {
    return {
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
    };
  }

  async getPortfolioHistory(userId: string) {
    return {
      history: [],
    };
  }
}
