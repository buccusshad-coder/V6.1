import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  chain?: string; // No validation - auto-detected by service

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
