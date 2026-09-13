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
import { Wallet } from '../../wallets/entities/wallet.entity';

@Entity('positions')
@Index(['userId', 'walletId'])
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column()
  symbol: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  entryPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  currentPrice: number;

  @Column({ default: 'ethereum' })
  chain: string;

  @Column({ type: 'varchar', length: 20, default: 'token' })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
