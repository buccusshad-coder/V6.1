import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import api from '../services/api';

interface PortfolioStats {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  allTimeReturn: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    allTimeReturn: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await api.getPortfolioOverview();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <Navigation />
      <div className="container">
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>Portfolio Dashboard</h1>

      <div className="grid grid-2">
        <div className="stat-card">
          <div className="stat-label">Total Portfolio Value</div>
          <div className="stat-value">${stats.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">24h Change</div>
          <div className="stat-value">${stats.dayChange.toFixed(2)}</div>
          <div className={`stat-change ${stats.dayChange >= 0 ? 'positive' : 'negative'}`}>
            {stats.dayChange >= 0 ? '+' : ''}{stats.dayChangePercent.toFixed(2)}%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">All-Time Return</div>
          <div className="stat-value">{stats.allTimeReturn.toFixed(2)}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Positions</div>
          <div className="stat-value">--</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>Recent Transactions</h2>
        <p>Transactions will appear here as you add wallets and make trades.</p>
      </div>
      </div>
    </>
  );
}
