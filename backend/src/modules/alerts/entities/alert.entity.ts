import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('alerts')
@Index(['userId', 'createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  type: 'price' | 'portfolio' | 'position' | 'transaction';

  @Column()
  name: string;

  @Column({ nullable: true })
  symbol?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  condition?: 'above' | 'below' | 'change_percent';

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  targetPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  changePercent?: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  currentValue?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isTriggered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  triggeredAt?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
