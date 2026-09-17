import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string; // EVM address

  @IsString()
  @IsOptional()
  solanaAddress?: string; // Solana address

  @IsOptional()
  chain?: string; // No validation - auto-detected by service

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
