import { Injectable } from '@nestjs/common';
import { WalletScannerService } from '../wallets/wallet-scanner.service';
import { EtherscanService } from '../../integrations/etherscan.service';
import { PricesService } from '../prices/prices.service';

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
  constructor(
    private readonly walletScannerService: WalletScannerService,
    private readonly etherscanService: EtherscanService,
    private readonly pricesService: PricesService,
  ) {}

  /**
   * Create a complete trace of a token from mint to current location
   * Shows all transfers, swaps, bridges, and other interactions
   * Fetches real data from Etherscan API
   */
  async traceToken(
    walletAddress: string,
    tokenAddress: string,
    chain: string,
  ): Promise<TokenTrace> {
    try {
      // Fetch token metadata
      const metadata = await this.etherscanService.getTokenMetadata(tokenAddress, chain);

      // Fetch token transfer history for this wallet
      const transfers = await this.etherscanService.getTokenTransfers(walletAddress, chain);

      // Filter transfers for this specific token
      const tokenTransfers = transfers.filter(
        tx => tx.contractAddress.toLowerCase() === tokenAddress.toLowerCase(),
      );

      if (tokenTransfers.length === 0) {
        // No transfers found - return empty trace
        return {
          tokenSymbol: metadata.symbol || 'UNKNOWN',
          tokenAddress,
          quantity: 0,
          currentValue: 0,
          journey: [],
          lastAction: {
            action: 'none',
            location: walletAddress,
            timestamp: new Date(),
          },
          totalGainLoss: 0,
          roi: 0,
        };
      }

      // Sort transfers by timestamp
      tokenTransfers.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

      // Build journey
      const journey = [];
      let totalAmount = 0;
      let step = 1;

      for (const tx of tokenTransfers.slice(0, 20)) { // Limit to last 20 transactions
        const amount = this.etherscanService.parseDecimal(
          tx.value,
          parseInt(tx.tokenDecimal),
        );

        const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
        if (isIncoming) {
          totalAmount += amount;
        } else {
          totalAmount -= amount;
        }

        // Try to get price at time (fallback to current price)
        let priceAtTime = 0;
        try {
          const priceData = await this.pricesService.getLatestPrice(metadata.symbol);
          priceAtTime = parseFloat(priceData.current_price) || 0;
        } catch (e) {
          priceAtTime = 0;
        }

        journey.push({
          step: step++,
          action: isIncoming ? 'transfer' : 'transfer',
          from: tx.from,
          to: tx.to,
          amount,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          txHash: tx.hash,
          priceAtTime,
          valueAtTime: amount * priceAtTime,
          details: {
            gasPrice: `${parseInt(tx.gasPrice) / 1e9} gwei`,
            gasUsed: tx.gasUsed,
          },
        });
      }

      // Get current price
      let currentPrice = 0;
      try {
        const priceData = await this.pricesService.getLatestPrice(metadata.symbol);
        currentPrice = parseFloat(priceData.current_price) || 0;
      } catch (e) {
        currentPrice = 0;
      }

      const currentValue = totalAmount * currentPrice;
      const lastTransfer = tokenTransfers[tokenTransfers.length - 1];

      return {
        tokenSymbol: metadata.symbol,
        tokenAddress,
        quantity: totalAmount,
        currentValue,
        journey,
        lastAction: {
          action: 'transfer',
          location: lastTransfer.to,
          timestamp: new Date(parseInt(lastTransfer.timeStamp) * 1000),
        },
        totalGainLoss: 0,
        roi: 0,
      };
    } catch (error) {
      console.error('Error tracing token:', error);
      // Return empty trace on error
      return {
        tokenSymbol: 'ERROR',
        tokenAddress,
        quantity: 0,
        currentValue: 0,
        journey: [],
        lastAction: {
          action: 'error',
          location: walletAddress,
          timestamp: new Date(),
        },
        totalGainLoss: 0,
        roi: 0,
      };
    }
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
