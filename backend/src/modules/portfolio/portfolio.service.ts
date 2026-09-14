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

  async getPortfolioByWallet(userId: string) {
    const wallets = await this.walletRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const portfolioByWallet = await Promise.all(
      wallets.map(async (wallet) => {
        const positions = await this.positionRepository.find({
          where: { walletId: wallet.id },
        });

        const totalValue = positions.reduce(
          (sum, p) => sum + parseFloat(p.amount.toString()) * parseFloat(p.currentPrice?.toString() || '0'),
          0,
        );

        const totalCost = positions.reduce(
          (sum, p) => sum + parseFloat(p.amount.toString()) * parseFloat(p.entryPrice?.toString() || '0'),
          0,
        );

        const pnl = totalValue - totalCost;
        const roi = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

        return {
          walletId: wallet.id,
          walletName: wallet.name,
          chain: wallet.chain,
          address: wallet.address,
          positions: positions.map((p) => ({
            id: p.id,
            symbol: p.symbol,
            amount: p.amount,
            entryPrice: p.entryPrice,
            currentPrice: p.currentPrice,
            value: parseFloat(p.amount.toString()) * parseFloat(p.currentPrice?.toString() || '0'),
            pnl: (parseFloat(p.currentPrice?.toString() || '0') - parseFloat(p.entryPrice?.toString() || '0')) * parseFloat(p.amount.toString()),
            roi: ((parseFloat(p.currentPrice?.toString() || '0') - parseFloat(p.entryPrice?.toString() || '0')) / parseFloat(p.entryPrice?.toString() || '1')) * 100,
          })),
          totalValue: parseFloat(totalValue.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalPnL: parseFloat(pnl.toFixed(2)),
          totalROI: parseFloat(roi.toFixed(2)),
          positionCount: positions.length,
        };
      }),
    );

    return portfolioByWallet;
  }
}
