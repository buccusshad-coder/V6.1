import { IsString, IsEthereumAddress, IsOptional, IsObject } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  chain: string; // ethereum, arbitrum, base, solana

  @IsString()
  @IsOptional()
  type?: string; // evm, solana (defaults to evm)

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
