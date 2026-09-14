import { Injectable } from '@nestjs/common';

export interface TokenTrace {
  tokenSymbol: string;
  tokenAddress: string;
  quantity: number;
  currentValue: number;
  journey: {
    step: number;
    action: 'mint' | 'transfer' | 'swap' | 'bridge' | 'stake' | 'unstake';
    from: string;
    to: string;
    amount: number;
    timestamp: Date;
    txHash: string;
    priceAtTime: number;
    valueAtTime: number;
    details: {
      dex?: string;
      gasPrice?: string;
      gasUsed?: string;
      bridgeService?: string;
    };
  }[];
  lastAction: {
    action: string;
    location: string;
    timestamp: Date;
  };
  totalGainLoss: number;
  roi: number;
}

@Injectable()
export class TokenTracerService {
  /**
   * Create a complete trace of a token from mint to current location
   * Shows all transfers, swaps, bridges, and other interactions
   */
  async traceToken(
    walletAddress: string,
    tokenAddress: string,
    chain: string,
  ): Promise<TokenTrace> {
    // This would integrate with blockchain APIs to build the complete journey

    return {
      tokenSymbol: 'SAMPLE',
      tokenAddress,
      quantity: 100,
      currentValue: 5000,
      journey: [
        {
          step: 1,
          action: 'mint',
          from: '0x0000000000000000000000000000000000000000',
          to: '0xoriginminter...',
          amount: 10000,
          timestamp: new Date('2024-01-01'),
          txHash: '0x123abc...',
          priceAtTime: 1.0,
          valueAtTime: 10000,
          details: {},
        },
        {
          step: 2,
          action: 'transfer',
          from: '0xoriginminter...',
          to: '0xcex...',
          amount: 5000,
          timestamp: new Date('2024-02-01'),
          txHash: '0x456def...',
          priceAtTime: 1.2,
          valueAtTime: 6000,
          details: {},
        },
        {
          step: 3,
          action: 'swap',
          from: '0xcex...',
          to: walletAddress,
          amount: 100,
          timestamp: new Date('2024-03-01'),
          txHash: '0x789ghi...',
          priceAtTime: 50,
          valueAtTime: 5000,
          details: {
            dex: 'Uniswap',
            gasPrice: '45 gwei',
            gasUsed: '150000',
          },
        },
      ],
      lastAction: {
        action: 'swap',
        location: walletAddress,
        timestamp: new Date('2024-03-01'),
      },
      totalGainLoss: 0,
      roi: 0,
    };
  }

  /**
   * Format token trace as Excel-like table for display
   */
  formatTraceAsTable(trace: TokenTrace): Array<{
    step: number;
    action: string;
    from: string;
    to: string;
    amount: string;
    price: string;
    value: string;
    date: string;
    txHash: string;
  }> {
    return trace.journey.map((tx) => ({
      step: tx.step,
      action: tx.action.toUpperCase(),
      from: tx.from.substring(0, 10) + '...',
      to: tx.to.substring(0, 10) + '...',
      amount: tx.amount.toString(),
      price: `$${tx.priceAtTime.toFixed(2)}`,
      value: `$${tx.valueAtTime.toLocaleString()}`,
      date: new Date(tx.timestamp).toLocaleDateString(),
      txHash: tx.txHash,
    }));
  }

  /**
   * Get summary of token movements
   */
  summarizeMovements(trace: TokenTrace): {
    totalTransfers: number;
    totalSwaps: number;
    totalBridges: number;
    uniqueLocations: number;
    firstAcquisition: Date;
    lastMovement: Date;
    currentLocation: string;
  } {
    const transfers = trace.journey.filter((j) => j.action === 'transfer').length;
    const swaps = trace.journey.filter((j) => j.action === 'swap').length;
    const bridges = trace.journey.filter((j) => j.action === 'bridge').length;
    const locations = new Set(
      trace.journey.map((j) => j.to),
    ).size;

    return {
      totalTransfers: transfers,
      totalSwaps: swaps,
      totalBridges: bridges,
      uniqueLocations: locations,
      firstAcquisition: trace.journey[0]?.timestamp || new Date(),
      lastMovement: trace.journey[trace.journey.length - 1]?.timestamp || new Date(),
      currentLocation: trace.lastAction.location,
    };
  }
}
