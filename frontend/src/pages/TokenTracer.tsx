import React, { useState } from 'react';
import api from '../services/api';

interface TraceEntry {
  step: number;
  action: string;
  from: string;
  to: string;
  amount: string;
  price: string;
  value: string;
  date: string;
  txHash: string;
}

interface TraceSummary {
  totalTransfers: number;
  totalSwaps: number;
  totalBridges: number;
  uniqueLocations: number;
  firstAcquisition: string;
  lastMovement: string;
  currentLocation: string;
}

export default function TokenTracer() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [summary, setSummary] = useState<TraceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTraceToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [traceRes, summaryRes] = await Promise.all([
        api.getTokenTraceAsTable(tokenAddress, chain),
        api.getTraceSummary(tokenAddress, chain),
      ]);

      setTrace(traceRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trace token');
      setTrace([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>🔍 Token Tracer</h1>

      {/* Search Form */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>Trace Token Journey</h2>
        <form onSubmit={handleTraceToken}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Token Address
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Chain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
                <option value="optimism">Optimism</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {loading ? 'Tracing...' : 'Trace'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c00', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Transfers</div>
            <div className="stat-value">{summary.totalTransfers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Swaps</div>
            <div className="stat-value">{summary.totalSwaps}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Locations</div>
            <div className="stat-value">{summary.uniqueLocations}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">First Acquisition</div>
            <div className="stat-value" style={{ fontSize: '0.9rem' }}>
              {new Date(summary.firstAcquisition).toLocaleDateString()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last Movement</div>
            <div className="stat-value" style={{ fontSize: '0.9rem' }}>
              {new Date(summary.lastMovement).toLocaleDateString()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Bridges</div>
            <div className="stat-value">{summary.totalBridges}</div>
          </div>
        </div>
      )}

      {/* Token Journey Table */}
      {trace.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Token Journey</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Step
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Action
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    From
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    To
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Amount
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Price
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Value
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>
                    Tx Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {trace.map((entry, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{entry.step}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '500' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor:
                            entry.action === 'TRANSFER'
                              ? '#e3f2fd'
                              : entry.action === 'SWAP'
                              ? '#f3e5f5'
                              : entry.action === 'BRIDGE'
                              ? '#e8f5e9'
                              : '#fff3e0',
                          color:
                            entry.action === 'TRANSFER'
                              ? '#1976d2'
                              : entry.action === 'SWAP'
                              ? '#7b1fa2'
                              : entry.action === 'BRIDGE'
                              ? '#388e3c'
                              : '#f57c00',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#666' }}>
                      {entry.from}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#666' }}>
                      {entry.to}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '500' }}>
                      {entry.amount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.9rem' }}>{entry.price}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '500' }}>
                      {entry.value}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                      {entry.date}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <a
                        href={`https://${chain === 'polygon' ? 'polygonscan' : chain === 'arbitrum' ? 'arbiscan' : chain === 'base' ? 'basescan' : chain === 'optimism' ? 'optimistic' : 'etherscan'}.io/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#667eea',
                          textDecoration: 'none',
                          fontFamily: 'monospace',
                        }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && trace.length === 0 && !error && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
            Enter a token address and select a chain to trace its complete journey from mint to current location.
          </p>
        </div>
      )}
    </div>
  );
}
