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
import { Position } from '../../positions/entities/position.entity';

@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['walletId', 'createdAt'])
export class Transaction {
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

  @Column({ nullable: true })
  positionId?: string;

  @ManyToOne(() => Position, { onDelete: 'SET NULL', nullable: true })
  position?: Position;

  @Column({ type: 'varchar', length: 20 })
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake';

  @Column()
  symbol: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  fee?: number;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  feeToken?: string;

  @Column({ default: 'ethereum' })
  chain: string;

  @Column({ nullable: true })
  txHash?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  transactionDate: Date;
}
