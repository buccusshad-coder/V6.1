import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePositionDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  entryPrice?: number;

  @IsNumber()
  @IsOptional()
  currentPrice?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
