import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateAlertDto {
  @IsEnum(['price', 'portfolio', 'position', 'transaction'])
  type: 'price' | 'portfolio' | 'position' | 'transaction';

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsEnum(['above', 'below', 'change_percent'])
  @IsOptional()
  condition?: 'above' | 'below' | 'change_percent';

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @IsNumber()
  @IsOptional()
  changePercent?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
