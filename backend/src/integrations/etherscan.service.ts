import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface EtherscanTokenBalance {
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  tokenContractAddress: string;
  balance: string;
}

interface EtherscanTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  type: string;
  functionName: string;
}

interface EtherscanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

@Injectable()
export class EtherscanService {
  private readonly apiKey = process.env.ETHERSCAN_API_KEY || 'YourEtherscanAPIKeyHere';
  private readonly apiKeyAlt = process.env.ETHERSCAN_ALT_API_KEY || '';
  private readonly alchemyKey = process.env.ALCHEMY_API_KEY || '';
  private readonly infuraKey = process.env.INFURA_API_KEY || '';

  private readonly baseUrl = 'https://api.etherscan.io/api';
  private readonly polygonBaseUrl = 'https://api.polygonscan.com/api';

  private readonly alchemyUrl = 'https://eth-mainnet.alchemyapi.io/v2';
  private readonly infuraUrl = 'https://mainnet.infura.io/v3';

  private getBaseUrl(chain: string): string {
    switch (chain.toLowerCase()) {
      case 'polygon':
        return this.polygonBaseUrl;
      case 'ethereum':
      default:
        return this.baseUrl;
    }
  }

  /**
   * Get all token balances for a wallet
   * Uses primary API key, falls back to alternate key if needed
   */
  async getTokenBalances(
    walletAddress: string,
    chain: string = 'ethereum',
  ): Promise<EtherscanTokenBalance[]> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      let response = null;

      // Try primary API key
      try {
        response = await axios.get(`${baseUrl}`, {
          params: {
            module: 'account',
            action: 'tokentx',
            address: walletAddress,
            startblock: 0,
            endblock: 99999999,
            sort: 'desc',
            apikey: this.apiKey,
          },
          timeout: 5000,
        });
      } catch (primaryError) {
        console.warn(`Primary API key failed for ${walletAddress}, trying alternate...`);

        // Fallback to alternate API key if available
        if (this.apiKeyAlt) {
          response = await axios.get(`${baseUrl}`, {
            params: {
              module: 'account',
              action: 'tokentx',
              address: walletAddress,
              startblock: 0,
              endblock: 99999999,
              sort: 'desc',
              apikey: this.apiKeyAlt,
            },
            timeout: 5000,
          });
        } else {
          throw primaryError;
        }
      }

      if (response.data.result === '0' || !Array.isArray(response.data.result)) {
        return [];
      }

      // Group by token and sum balances
      const tokenMap = new Map<string, EtherscanTokenBalance>();

      response.data.result.forEach((tx: EtherscanTokenTransfer) => {
        const key = tx.contractAddress.toLowerCase();
        const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            tokenSymbol: tx.tokenSymbol,
            tokenName: tx.tokenName,
            tokenDecimal: tx.tokenDecimal,
            tokenContractAddress: tx.contractAddress,
            balance: '0',
          });
        }

        const token = tokenMap.get(key)!;
        const amount = BigInt(tx.value);
        const currentBalance = BigInt(token.balance);

        token.balance = (
          isIncoming
            ? currentBalance + amount
            : currentBalance - amount
        ).toString();
      });

      return Array.from(tokenMap.values());
    } catch (error) {
      console.error('Error fetching token balances with fallback:', error);
      return [];
    }
  }

  /**
   * Get ETH balance for wallet
   */
  async getEthBalance(
    walletAddress: string,
    chain: string = 'ethereum',
  ): Promise<{ balance: string; symbol: string }> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'account',
          action: 'balance',
          address: walletAddress,
          tag: 'latest',
          apikey: this.apiKey,
        },
      });

      return {
        balance: response.data.result,
        symbol: chain.toLowerCase() === 'polygon' ? 'MATIC' : 'ETH',
      };
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return { balance: '0', symbol: 'ETH' };
    }
  }

  /**
   * Get all transactions for a wallet
   */
  async getTransactions(
    walletAddress: string,
    chain: string = 'ethereum',
    page: number = 1,
    pageSize: number = 100,
  ): Promise<EtherscanTransaction[]> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'account',
          action: 'txlist',
          address: walletAddress,
          startblock: 0,
          endblock: 99999999,
          page,
          offset: pageSize,
          sort: 'desc',
          apikey: this.apiKey,
        },
      });

      if (response.data.result === '0' || !Array.isArray(response.data.result)) {
        return [];
      }

      return response.data.result;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Get all token transfers for a wallet
   */
  async getTokenTransfers(
    walletAddress: string,
    chain: string = 'ethereum',
    page: number = 1,
    pageSize: number = 100,
  ): Promise<EtherscanTokenTransfer[]> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'account',
          action: 'tokentx',
          address: walletAddress,
          startblock: 0,
          endblock: 99999999,
          page,
          offset: pageSize,
          sort: 'desc',
          apikey: this.apiKey,
        },
      });

      if (response.data.result === '0' || !Array.isArray(response.data.result)) {
        return [];
      }

      return response.data.result;
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Get token metadata (name, symbol, decimals, total supply)
   */
  async getTokenMetadata(
    tokenAddress: string,
    chain: string = 'ethereum',
  ): Promise<{
    name: string;
    symbol: string;
    decimals: string;
    totalSupply: string;
  }> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'token',
          action: 'tokeninfo',
          contractaddress: tokenAddress,
          apikey: this.apiKey,
        },
      });

      if (!response.data.result) {
        return {
          name: 'Unknown',
          symbol: 'UNKNOWN',
          decimals: '18',
          totalSupply: '0',
        };
      }

      return {
        name: response.data.result.name,
        symbol: response.data.result.symbol,
        decimals: response.data.result.decimals,
        totalSupply: response.data.result.totalSupply,
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {
        name: 'Unknown',
        symbol: 'UNKNOWN',
        decimals: '18',
        totalSupply: '0',
      };
    }
  }

  /**
   * Check if address is a contract
   */
  async isContract(
    address: string,
    chain: string = 'ethereum',
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'account',
          action: 'getcode',
          address,
          tag: 'latest',
          apikey: this.apiKey,
        },
      });

      return response.data.result !== '0x';
    } catch (error) {
      console.error('Error checking if address is contract:', error);
      return false;
    }
  }

  /**
   * Get gas tracker data
   */
  async getGasTracker(chain: string = 'ethereum'): Promise<{
    safe: string;
    standard: string;
    fast: string;
  }> {
    try {
      const baseUrl = this.getBaseUrl(chain);
      const response = await axios.get(`${baseUrl}`, {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: this.apiKey,
        },
      });

      return {
        safe: response.data.result.SafeGasPrice,
        standard: response.data.result.StandardGasPrice,
        fast: response.data.result.FastGasPrice,
      };
    } catch (error) {
      console.error('Error fetching gas tracker:', error);
      return { safe: '0', standard: '0', fast: '0' };
    }
  }

  /**
   * Parse decimal value from blockchain format
   */
  parseDecimal(value: string, decimals: number): number {
    const divisor = Math.pow(10, decimals);
    return parseFloat(value) / divisor;
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    return address.substring(0, 10) + '...' + address.substring(address.length - 8);
  }

  /**
   * Check API health and key validity
   */
  async checkHealth(): Promise<{
    primary: boolean;
    alternate: boolean;
    status: string;
  }> {
    const results = {
      primary: false,
      alternate: false,
      status: 'checking...',
    };

    try {
      const testAddress = '0x0000000000000000000000000000000000000000';

      // Test primary key
      try {
        await axios.get('https://api.etherscan.io/api', {
          params: {
            module: 'account',
            action: 'balance',
            address: testAddress,
            tag: 'latest',
            apikey: this.apiKey,
          },
          timeout: 3000,
        });
        results.primary = true;
      } catch (e) {
        results.primary = false;
      }

      // Test alternate key
      if (this.apiKeyAlt) {
        try {
          await axios.get('https://api.etherscan.io/api', {
            params: {
              module: 'account',
              action: 'balance',
              address: testAddress,
              tag: 'latest',
              apikey: this.apiKeyAlt,
            },
            timeout: 3000,
          });
          results.alternate = true;
        } catch (e) {
          results.alternate = false;
        }
      }

      if (results.primary || results.alternate) {
        results.status = 'healthy';
      } else {
        results.status = 'unhealthy';
      }

      return results;
    } catch (error) {
      results.status = 'error';
      return results;
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): Array<{
    name: string;
    id: string;
    provider: string;
    apiUrl: string;
  }> {
    return [
      {
        name: 'Ethereum',
        id: 'ethereum',
        provider: 'Etherscan',
        apiUrl: 'https://api.etherscan.io',
      },
      {
        name: 'Polygon',
        id: 'polygon',
        provider: 'Polygonscan',
        apiUrl: 'https://api.polygonscan.com',
      },
      {
        name: 'Arbitrum One',
        id: 'arbitrum',
        provider: 'Arbiscan',
        apiUrl: 'https://api.arbiscan.io',
      },
      {
        name: 'Base',
        id: 'base',
        provider: 'Basescan',
        apiUrl: 'https://api.basescan.org',
      },
      {
        name: 'Optimism',
        id: 'optimism',
        provider: 'Optimistic Etherscan',
        apiUrl: 'https://api-optimistic.etherscan.io',
      },
    ];
  }
}
