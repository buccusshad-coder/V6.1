import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/WalletPortfolio.css';

interface Token {
  symbol: string;
  name: string;
  address: string;
  amount: string;
  decimals: number;
  value: number;
}

interface WalletDetails {
  id: string;
  name: string;
  address: string;
  chain: string;
  balance: number;
  metadata?: {
    holdings: Token[];
    totalValue: number;
    scannedAt: string;
  };
}

export default function WalletPortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hideSmallTokens, setHideSmallTokens] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const response = await api.getWallet(id!);
        setWallet(response.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchWallet();
  }, [id]);

  if (loading) return <div className="loading">Loading portfolio...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!wallet) return <div className="alert alert-error">Wallet not found</div>;

  const holdings = wallet.metadata?.holdings || [];
  const totalValue = parseFloat(String(wallet.metadata?.totalValue || wallet.balance || 0));

  // Filter out small tokens if enabled
  const filteredTokens = hideSmallTokens
    ? holdings.filter(t => t.value >= 1)
    : holdings;

  const sortedTokens = [...filteredTokens].sort((a, b) => b.value - a.value);

  return (
    <>
      <Navigation />
      <div className="portfolio-container">
        <div className="portfolio-header">
          <button onClick={() => navigate('/wallets')} className="btn-back">
            ← Back
          </button>
          <div>
            <h1>{wallet.name}</h1>
            <p className="wallet-address">{wallet.address}</p>
            <p className="wallet-chain">{wallet.chain.toUpperCase()}</p>
          </div>
        </div>

        <div className="portfolio-summary">
          <div className="summary-card">
            <h3>Total Portfolio Value</h3>
            <p className="total-value">${totalValue.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Assets</h3>
            <p className="assets-count">{sortedTokens.length}</p>
          </div>
        </div>

        <div className="holdings-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Holdings</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hideSmallTokens}
                onChange={(e) => setHideSmallTokens(e.target.checked)}
              />
              Hide tokens &lt; $1 (scam filter)
            </label>
          </div>
          {sortedTokens.length === 0 ? (
            <p className="empty">No tokens found in this wallet</p>
          ) : (
            <div className="holdings-table">
              <div className="table-header">
                <div className="col-symbol">Asset</div>
                <div className="col-amount">Amount</div>
                <div className="col-value">Value</div>
                <div className="col-percent">% of Portfolio</div>
              </div>
              {sortedTokens.map((token, idx) => (
                <div key={idx} className="table-row">
                  <div className="col-symbol">
                    <strong>{token.symbol}</strong>
                    <small>{token.name}</small>
                  </div>
                  <div className="col-amount">
                    {parseFloat(token.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </div>
                  <div className="col-value">
                    ${token.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="col-percent">
                    {totalValue > 0
                      ? ((token.value / totalValue) * 100).toFixed(2)
                      : '0.00'}
                    %
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
