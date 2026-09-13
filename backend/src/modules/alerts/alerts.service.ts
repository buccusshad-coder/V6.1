import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto, UpdateAlertDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async create(userId: string, createAlertDto: CreateAlertDto) {
    const alert = this.alertRepository.create(createAlertDto);
    alert.userId = userId;
    return this.alertRepository.save(alert);
  }

  async findAll(userId: string) {
    return this.alertRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.alertRepository.findOne({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, updateAlertDto: UpdateAlertDto) {
    const alert = await this.findOne(id, userId);
    if (!alert) {
      throw new BadRequestException('Alert not found');
    }
    Object.assign(alert, updateAlertDto);
    return this.alertRepository.save(alert);
  }

  async remove(id: string, userId: string) {
    const alert = await this.findOne(id, userId);
    if (!alert) {
      throw new BadRequestException('Alert not found');
    }
    alert.isActive = false;
    return this.alertRepository.save(alert);
  }

  async getAlertsByType(userId: string, type: 'price' | 'portfolio' | 'position' | 'transaction') {
    return this.alertRepository.find({
      where: { userId, type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertsBySymbol(userId: string, symbol: string) {
    return this.alertRepository.find({
      where: { userId, symbol, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTriggeredAlerts(userId: string) {
    return this.alertRepository.find({
      where: { userId, isTriggered: true },
      order: { triggeredAt: 'DESC' },
    });
  }

  async triggerAlert(id: string, userId: string) {
    const alert = await this.findOne(id, userId);
    if (!alert) {
      throw new BadRequestException('Alert not found');
    }
    alert.isTriggered = true;
    alert.triggeredAt = new Date();
    return this.alertRepository.save(alert);
  }

  async resetAlert(id: string, userId: string) {
    const alert = await this.findOne(id, userId);
    if (!alert) {
      throw new BadRequestException('Alert not found');
    }
    alert.isTriggered = false;
    alert.triggeredAt = null;
    return this.alertRepository.save(alert);
  }

  async getActiveAlerts(userId: string) {
    return this.alertRepository.find({
      where: { userId, isActive: true, isTriggered: false },
      order: { createdAt: 'DESC' },
    });
  }
}
