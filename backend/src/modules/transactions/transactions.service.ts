import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto, UpdateTransactionDto } from './dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const transaction = this.transactionRepository.create(createTransactionDto);
    transaction.userId = userId;
    return this.transactionRepository.save(transaction);
  }

  async findAll(userId: string) {
    return this.transactionRepository.find({
      where: { userId, isActive: true },
      order: { transactionDate: 'DESC' },
      relations: ['wallet', 'position'],
    });
  }

  async findOne(id: string, userId: string) {
    return this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['wallet', 'position'],
    });
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id, userId);
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    Object.assign(transaction, updateTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    transaction.isActive = false;
    return this.transactionRepository.save(transaction);
  }

  async findByWallet(walletId: string, userId: string) {
    return this.transactionRepository.find({
      where: { walletId, userId, isActive: true },
      order: { transactionDate: 'DESC' },
      relations: ['position'],
    });
  }

  async findByPosition(positionId: string, userId: string) {
    return this.transactionRepository.find({
      where: { positionId, userId, isActive: true },
      order: { transactionDate: 'DESC' },
    });
  }

  async getTotalVolume(userId: string) {
    const transactions = await this.findAll(userId);
    return transactions.reduce((sum, tx) => {
      const value = parseFloat(tx.amount.toString()) * parseFloat(tx.price.toString());
      return sum + value;
    }, 0);
  }

  async getTransactionsByType(userId: string, type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake') {
    return this.transactionRepository.find({
      where: { userId, type, isActive: true },
      order: { transactionDate: 'DESC' },
    });
  }

  async getRecentTransactions(userId: string, limit: number = 10) {
    return this.transactionRepository.find({
      where: { userId, isActive: true },
      order: { transactionDate: 'DESC' },
      take: limit,
      relations: ['wallet'],
    });
  }
}
