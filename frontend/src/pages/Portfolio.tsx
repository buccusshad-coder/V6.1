import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Position {
  id: string;
  symbol: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  roi: number;
}

interface Wallet {
  walletId: string;
  walletName: string;
  chain: string;
  address: string;
  positions: Position[];
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalROI: number;
  positionCount: number;
}

interface PortfolioOverview {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
}

export default function Portfolio() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [overview, setOverview] = useState<PortfolioOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const [overviewData, walletsData] = await Promise.all([
        api.getPortfolioOverview(),
        api.get('/portfolio/by-wallet'),
      ]);

      setOverview(overviewData.data);
      setWallets(walletsData.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load portfolio');
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading portfolio...</p></div>;

  return (
    <div className="container">
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>📊 Portfolio</h1>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* Portfolio Summary */}
      {overview && (
        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Value</div>
            <div className="stat-value" style={{ color: '#667eea' }}>
              ${overview.totalValue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Unrealized P&L</div>
            <div className="stat-value" style={{ color: overview.dayChange >= 0 ? '#10b981' : '#ef4444' }}>
              ${overview.dayChange?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Return %</div>
            <div className="stat-value" style={{ color: overview.dayChangePercent >= 0 ? '#10b981' : '#ef4444' }}>
              {overview.dayChangePercent?.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Wallets Breakdown */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>Wallets Breakdown</h2>

        {wallets.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No wallets yet. Create a wallet and add positions to see your portfolio.
            </p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div key={wallet.walletId} className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{wallet.walletName}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {wallet.chain.toUpperCase()} • {wallet.positionCount} position{wallet.positionCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                    ${wallet.totalValue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: wallet.totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
                    {wallet.totalPnL >= 0 ? '+' : ''}${wallet.totalPnL?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    ({wallet.totalROI >= 0 ? '+' : ''}{wallet.totalROI?.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Positions in Wallet */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>Symbol</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>Entry</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>Current</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>Value</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>P&L</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.positions.map((pos) => (
                    <tr key={pos.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '500' }}>{pos.symbol.toUpperCase()}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>{Number(pos.amount).toFixed(4)}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>${Number(pos.entryPrice).toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>${Number(pos.currentPrice).toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '500' }}>
                        ${pos.value?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        color: pos.pnl >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500',
                      }}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        color: pos.roi >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500',
                      }}>
                        {pos.roi >= 0 ? '+' : ''}{pos.roi?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Wallet Summary */}
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Cost Basis</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    ${wallet.totalCost?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Current Value</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    ${wallet.totalValue?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Gain/Loss</p>
                  <p style={{
                    margin: '5px 0 0 0',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: wallet.totalPnL >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    {wallet.totalPnL >= 0 ? '+' : ''}${wallet.totalPnL?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
