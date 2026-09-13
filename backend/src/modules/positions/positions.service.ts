import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { CreatePositionDto, UpdatePositionDto } from './dto';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
  ) {}

  async create(userId: string, createPositionDto: CreatePositionDto) {
    const position = this.positionRepository.create(createPositionDto);
    position.userId = userId;
    return this.positionRepository.save(position);
  }

  async findAll(userId: string) {
    return this.positionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.positionRepository.findOne({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, updatePositionDto: UpdatePositionDto) {
    const position = await this.findOne(id, userId);
    if (!position) {
      throw new BadRequestException('Position not found');
    }
    Object.assign(position, updatePositionDto);
    return this.positionRepository.save(position);
  }

  async remove(id: string, userId: string) {
    const position = await this.findOne(id, userId);
    if (!position) {
      throw new BadRequestException('Position not found');
    }
    position.isActive = false;
    return this.positionRepository.save(position);
  }

  async findByWallet(walletId: string, userId: string) {
    return this.positionRepository.find({
      where: { walletId, userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalValue(userId: string) {
    const positions = await this.findAll(userId);
    return positions.reduce((sum, pos) => {
      const posValue = parseFloat(pos.amount.toString()) *
        parseFloat(pos.currentPrice?.toString() || '0');
      return sum + posValue;
    }, 0);
  }

  async getPositionsByChain(userId: string) {
    const positions = await this.findAll(userId);
    const byChain = {};
    positions.forEach((pos) => {
      if (!byChain[pos.chain]) {
        byChain[pos.chain] = [];
      }
      byChain[pos.chain].push(pos);
    });
    return byChain;
  }
}
