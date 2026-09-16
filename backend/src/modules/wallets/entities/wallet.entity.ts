import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('wallets')
@Index(['userId', 'address'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'varchar', length: 50, default: 'ethereum' })
  chain: string; // primary chain - auto-detected from address

  @Column({ type: 'simple-array', nullable: true })
  chains?: string[]; // support multiple chains - ethereum, arbitrum, base, solana, polygon, optimism

  @Column({ type: 'varchar', length: 20, default: 'evm' })
  type: string; // evm, solana, etc.

  @Column({ type: 'decimal', precision: 36, scale: 18, default: 0 })
  balance: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
