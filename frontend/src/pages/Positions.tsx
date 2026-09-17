import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/Positions.css';

interface Token {
  symbol: string;
  name: string;
  amount: string;
  value: number;
  chain?: string;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  chain?: string;
  chains?: string[];
  metadata?: {
    holdings?: Token[];
  };
}

export default function Positions() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadWallets = async () => {
      try {
        setLoading(true);
        const response = await api.getWallets();
        if (isMounted && response?.data) {
          setWallets(Array.isArray(response.data) ? response.data : []);
          setError('');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading wallets:', err);
          setWallets([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWallets();
    return () => { isMounted = false; };
  }, []);

  const allHoldings = wallets.flatMap(wallet =>
    (wallet.metadata?.holdings || []).map(token => ({
      ...token,
      walletName: wallet.name,
    }))
  ).sort((a, b) => (b.value || 0) - (a.value || 0));

  const totalValue = wallets.reduce((sum, w) => {
    const balance = typeof w.balance === 'string' ? parseFloat(w.balance) : (w.balance || 0);
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  return (
    <>
      <Navigation />
      <div className="positions-container">
        <div className="positions-header">
          <h1>Holdings</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading holdings...</div>
        ) : wallets.length === 0 ? (
          <div className="empty-state">
            <p>No wallets yet. Create a wallet to see your holdings!</p>
          </div>
        ) : (
          <>
            {totalValue > 0 && (
              <div className="positions-summary">
                <div className="summary-item">
                  <span>Total Holdings Value</span>
                  <strong>${totalValue.toFixed(2)}</strong>
                </div>
                <div className="summary-item">
                  <span>Assets</span>
                  <strong>{allHoldings.length}</strong>
                </div>
              </div>
            )}

            {allHoldings.length === 0 ? (
              <div className="empty-state">
                <p>No tokens found in your wallets</p>
              </div>
            ) : (
              <div className="positions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Value</th>
                      <th>% of Portfolio</th>
                      <th>Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHoldings.map((token, idx) => (
                      <tr key={idx}>
                        <td className="symbol">
                          <strong>{token.symbol}</strong>
                          <small>{token.name}</small>
                        </td>
                        <td>{parseFloat(token.amount).toFixed(4)}</td>
                        <td>${(token.value || 0).toFixed(2)}</td>
                        <td>
                          {totalValue > 0
                            ? (((token.value || 0) / totalValue) * 100).toFixed(2)
                            : '0.00'}
                          %
                        </td>
                        <td>{token.walletName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
