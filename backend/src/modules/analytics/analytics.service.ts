import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Position } from '../positions/entities/position.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

interface Analytics {
  totalVolume: number;
  totalFees: number;
  avgTradeSize: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  largestWin: number;
  largestLoss: number;
  riskRewardRatio: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  async getPortfolioAnalytics(userId: string): Promise<Analytics> {
    const transactions = await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const buyTransactions = transactions.filter((t) => t.type === 'buy');
    const sellTransactions = transactions.filter((t) => t.type === 'sell');

    const totalVolume = transactions.reduce((sum, t) => sum + (t.amount * t.price || 0), 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);

    let profitableTrades = 0;
    let largestWin = 0;
    let largestLoss = 0;

    for (const sell of sellTransactions) {
      const buyPrice = buyTransactions
        .filter((b) => b.symbol === sell.symbol && b.createdAt < sell.createdAt)
        .reduce((avg, b) => avg + b.price, 0) / Math.max(buyTransactions.filter((b) => b.symbol === sell.symbol).length, 1);

      const profit = (sell.price - buyPrice) * sell.amount;
      if (profit > 0) {
        profitableTrades++;
        largestWin = Math.max(largestWin, profit);
      } else {
        largestLoss = Math.min(largestLoss, profit);
      }
    }

    return {
      totalVolume,
      totalFees,
      avgTradeSize: totalVolume / Math.max(transactions.length, 1),
      winRate: (profitableTrades / Math.max(sellTransactions.length, 1)) * 100,
      totalTrades: transactions.length,
      profitableTrades,
      largestWin,
      largestLoss,
      riskRewardRatio: largestWin / Math.max(Math.abs(largestLoss), 1),
    };
  }

  async getChainDistribution(userId: string) {
    const wallets = await this.walletRepository.find({ where: { userId } });
    const distribution: Record<string, number> = {};

    for (const wallet of wallets) {
      const positions = await this.positionRepository.find({
        where: { walletId: wallet.id },
      });

      const value = positions.reduce(
        (sum, p) => sum + (p.amount * p.currentPrice),
        0,
      );

      distribution[wallet.chain] = (distribution[wallet.chain] || 0) + value;
    }

    return distribution;
  }

  async getSymbolDistribution(userId: string) {
    const positions = await this.positionRepository.find({
      where: { userId },
    });

    const distribution: Record<string, number> = {};
    for (const position of positions) {
      const value = position.amount * position.currentPrice;
      distribution[position.symbol] =
        (distribution[position.symbol] || 0) + value;
    }

    return distribution;
  }

  async getPerformanceMetrics(userId: string) {
    const positions = await this.positionRepository.find({
      where: { userId },
    });

    const totalCost = positions.reduce(
      (sum, p) => sum + p.amount * p.entryPrice,
      0,
    );
    const totalValue = positions.reduce(
      (sum, p) => sum + p.amount * p.currentPrice,
      0,
    );
    const totalPnL = totalValue - totalCost;
    const roi = (totalPnL / Math.max(totalCost, 1)) * 100;

    return {
      totalCost,
      totalValue,
      totalPnL,
      roi,
      positions: positions.length,
    };
  }
}
