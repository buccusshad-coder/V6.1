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
  value?: number;
}

// Common Solana tokens database
const SOLANA_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  'EPjFWaLb3hyccqpPmyvPTYqfVcWnGumFeWMXgqiNZsDw': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium', decimals: 6 },
  'SRMuApVgqbCmRgtAGsnLKV7XM9LgRVQXhUaKc92NqsgX': { symbol: 'SRM', name: 'Serum', decimals: 6 },
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac': { symbol: 'MNGO', name: 'Mango', decimals: 6 },
  'whirLbMiicVdio4KfQ7N0xrKmEaKvTAl3tskVevm6qk': { symbol: 'WHIRL', name: 'Whirlpool', decimals: 6 },
  'USDCokQsV24b9UZRSSw5BSG2kMd5THaxbJMhénc5gVJ': { symbol: 'USDCpo', name: 'USD Coin (Polygon)', decimals: 6 },
};

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
      const tokens: SolanaTokenBalance[] = [];

      for (const account of accounts) {
        const mint = account.account.data.parsed.info.mint;
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        const uiAmount = parseFloat(tokenAmount?.uiAmountString || '0');

        // Only include tokens with non-zero balance
        if (uiAmount > 0) {
          const metadata = SOLANA_TOKENS[mint] || { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 0 };

          tokens.push({
            mint,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: tokenAmount?.decimals || metadata.decimals || 0,
            amount: tokenAmount?.amount || '0',
            uiAmount,
            uiAmountString: tokenAmount?.uiAmountString || '0',
          });
        }
      }

      console.log(`✅ Found ${tokens.length} Solana tokens for ${walletAddress}`);
      return tokens;
    } catch (error) {
      console.error('❌ Error fetching Solana token balances:', error);
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
