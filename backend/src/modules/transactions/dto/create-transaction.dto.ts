import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  walletId: string;

  @IsEnum(['buy', 'sell', 'transfer', 'swap', 'stake', 'unstake'])
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake';

  @IsString()
  symbol: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  fee?: number;

  @IsString()
  @IsOptional()
  feeToken?: string;

  @IsString()
  @IsOptional()
  chain?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  txHash?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
