import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface SolanaTokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: string;
  uiAmount: number;
  uiAmountString: string;
}

interface SolanaTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  amount: number;
  fee: number;
  status: string;
  mint?: string;
  signer: string;
}

interface SolanaTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  freezeAuthority: string;
  mintAuthority: string;
}

@Injectable()
export class HeliusService {
  private readonly apiKey = process.env.HELIUS_API_KEY || 'YourHeliusAPIKeyHere';
  private readonly baseUrl = 'https://mainnet.helius-rpc.com';

  /**
   * Get all token balances for a Solana wallet
   */
  async getTokenBalances(walletAddress: string): Promise<SolanaTokenBalance[]> {
    try {
      const response = await axios.post(`${this.baseUrl}?api-key=${this.apiKey}`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          {
            programId: 'TokenkegQfeZyiNwAJsyFbPVwwQQfNbGreg7h6UXe5',
          },
          {
            encoding: 'jsonParsed',
          },
        ],
      });

      const accounts = response.data.result?.value || [];
      return accounts.map((account: any) => ({
        mint: account.account.data.parsed.info.mint,
        symbol: account.account.data.parsed.info.tokenAmount?.uiAmount ? 'UNKNOWN' : 'UNKNOWN',
        name: 'Unknown Token',
        decimals: account.account.data.parsed.info.tokenAmount?.decimals || 0,
        amount: account.account.data.parsed.info.tokenAmount?.amount || '0',
        uiAmount: account.account.data.parsed.info.tokenAmount?.uiAmount || 0,
        uiAmountString: account.account.data.parsed.info.tokenAmount?.uiAmountString || '0',
      }));
    } catch (error) {
      console.error('Error fetching Solana token balances:', error);
      return [];
    }
  }

  /**
   * Get SOL balance for wallet
   */
  async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const response = await axios.post(`${this.baseUrl}?api-key=${this.apiKey}`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [walletAddress],
      });

      const lamports = response.data.result?.value || 0;
      return lamports / 1_000_000_000; // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }

  /**
   * Get transaction history for wallet
   */
  async getTransactionHistory(
    walletAddress: string,
    limit: number = 50,
  ): Promise<SolanaTransaction[]> {
    try {
      const response = await axios.post(`${this.baseUrl}?api-key=${this.apiKey}`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [walletAddress, { limit }],
      });

      const signatures = response.data.result || [];
      const transactions: SolanaTransaction[] = [];

      for (const sig of signatures.slice(0, limit)) {
        try {
          const txResponse = await axios.post(`${this.baseUrl}?api-key=${this.apiKey}`, {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [sig.signature, { encoding: 'json' }],
          });

          const tx = txResponse.data.result;
          if (tx) {
            transactions.push({
              signature: sig.signature,
              timestamp: tx.blockTime || 0,
              type: this.detectTransactionType(tx),
              source: 'solana',
              amount: Math.abs(
                tx.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount -
                  tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0,
              ),
              fee: tx.meta?.fee || 0,
              status: tx.meta?.err ? 'failed' : 'success',
              signer: tx.transaction.message.accountKeys[0]?.pubkey || '',
            });
          }
        } catch (e) {
          console.warn(`Could not fetch transaction ${sig.signature}:`, e);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(mintAddress: string): Promise<SolanaTokenInfo> {
    try {
      const response = await axios.post(`${this.baseUrl}?api-key=${this.apiKey}`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenSupply',
        params: [mintAddress],
      });

      return {
        mint: mintAddress,
        name: 'Unknown',
        symbol: 'UNKNOWN',
        decimals: response.data.result?.value?.decimals || 0,
        supply: response.data.result?.value?.amount || '0',
        freezeAuthority: '',
        mintAuthority: '',
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {
        mint: mintAddress,
        name: 'Unknown',
        symbol: 'UNKNOWN',
        decimals: 0,
        supply: '0',
        freezeAuthority: '',
        mintAuthority: '',
      };
    }
  }

  /**
   * Parse transaction program instructions to detect type
   */
  private detectTransactionType(tx: any): string {
    if (!tx.transaction?.message?.instructions) {
      return 'unknown';
    }

    const instructions = tx.transaction.message.instructions;

    for (const instruction of instructions) {
      const programId = instruction.programId?.toString() || '';

      if (programId.includes('TokenkegQfeZyiNwAJsyFbPV')) {
        const data = instruction.data;
        if (data.includes('3')) return 'transfer';
        if (data.includes('11')) return 'swap';
      }

      if (programId.includes('So11111111111111111111111111111111111111112')) {
        return 'sol_transfer';
      }

      if (programId.includes('whirLbMiicVdio4KfUadKvMyWCqXeFevm4FK3znnrCa')) {
        return 'swap';
      }

      if (programId.includes('BSwp6bMoZHA8d3SKm1d7DYvDgMG2OpqyWQcsgbjGB577')) {
        return 'swap';
      }
    }

    return 'unknown';
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    return address.substring(0, 8) + '...' + address.substring(address.length - 8);
  }
}
