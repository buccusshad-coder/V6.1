import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAlertDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @IsNumber()
  @IsOptional()
  changePercent?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
