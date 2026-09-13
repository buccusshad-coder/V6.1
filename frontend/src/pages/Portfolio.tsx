import React from 'react';

export default function Portfolio() {
  return (
    <div className="container">
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>Portfolio Analytics</h1>

      <div className="grid grid-2">
        <div className="stat-card">
          <div className="stat-label">Sharpe Ratio</div>
          <div className="stat-value">--</div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Risk-adjusted returns</p>
        </div>

        <div className="stat-card">
          <div className="stat-label">Sortino Ratio</div>
          <div className="stat-value">--</div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Downside risk ratio</p>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Drawdown</div>
          <div className="stat-value">--</div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Peak to trough decline</p>
        </div>

        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">--</div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Winning positions</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>Performance Chart</h2>
        <p>Chart will appear here as you add wallets and track performance.</p>
      </div>
    </div>
  );
}
