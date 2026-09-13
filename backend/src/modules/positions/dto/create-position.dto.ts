import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  walletId: string;

  @IsString()
  symbol: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  @IsOptional()
  entryPrice?: number;

  @IsNumber()
  @IsOptional()
  currentPrice?: number;

  @IsString()
  @IsOptional()
  chain?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
