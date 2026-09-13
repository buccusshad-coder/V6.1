import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/Transactions.css';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake';
  symbol: string;
  amount: number;
  price: number;
  fee?: number;
  chain: string;
  txHash?: string;
  notes?: string;
  createdAt: string;
  wallet?: { name: string };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    walletId: '',
    type: 'buy',
    symbol: '',
    amount: '',
    price: '',
    fee: '',
    chain: 'ethereum',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
    fetchWallets();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.getTransactions();
      setTransactions(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await api.getWallets();
      setWallets(response.data);
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const data = {
        walletId: formData.walletId,
        type: formData.type,
        symbol: formData.symbol.toUpperCase(),
        amount: parseFloat(formData.amount),
        price: parseFloat(formData.price),
        fee: formData.fee ? parseFloat(formData.fee) : undefined,
        chain: formData.chain,
        notes: formData.notes || undefined,
      };

      if (editing) {
        await api.updateTransaction(editing, data);
        setSuccess('Transaction updated successfully');
        setEditing(null);
      } else {
        await api.createTransaction(data);
        setSuccess('Transaction added successfully');
      }
      resetForm();
      await fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      walletId: transaction.wallet?.name || '',
      type: transaction.type,
      symbol: transaction.symbol,
      amount: transaction.amount.toString(),
      price: transaction.price.toString(),
      fee: transaction.fee?.toString() || '',
      chain: transaction.chain,
      notes: transaction.notes || '',
    });
    setEditing(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deleteTransaction(id);
      setSuccess('Transaction deleted successfully');
      await fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({
      walletId: '',
      type: 'buy',
      symbol: '',
      amount: '',
      price: '',
      fee: '',
      chain: 'ethereum',
      notes: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return '#10b981';
      case 'sell':
        return '#ef4444';
      case 'transfer':
        return '#6366f1';
      case 'swap':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const totalVolume = transactions.reduce(
    (sum, tx) => sum + tx.amount * tx.price,
    0,
  );

  const totalFees = transactions.reduce(
    (sum, tx) => sum + (tx.fee || 0),
    0,
  );

  return (
    <>
      <Navigation />
      <div className="transactions-container">
        <div className="transactions-header">
          <h1>Transaction History</h1>
          <button
            className="btn-primary"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <div className="transaction-form">
            <h2>{editing ? 'Edit Transaction' : 'Add New Transaction'}</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="form-row">
                <div className="form-group">
                  <label>Wallet</label>
                  <select
                    value={formData.walletId}
                    onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                    required
                  >
                    <option value="">Select a wallet</option>
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="transfer">Transfer</option>
                    <option value="swap">Swap</option>
                    <option value="stake">Stake</option>
                    <option value="unstake">Unstake</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Symbol</label>
                  <input
                    type="text"
                    placeholder="ETH"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.00000001"
                    placeholder="1.5"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fee (optional)</label>
                  <input
                    type="number"
                    step="0.00000001"
                    placeholder="0"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chain</label>
                  <select
                    value={formData.chain}
                    onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="base">Base</option>
                    <option value="solana">Solana</option>
                    <option value="polygon">Polygon</option>
                    <option value="optimism">Optimism</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="Additional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Add'} Transaction
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="transactions-summary">
            <div className="summary-item">
              <span>Total Volume</span>
              <strong>${totalVolume.toFixed(2)}</strong>
            </div>
            <div className="summary-item">
              <span>Total Fees</span>
              <strong>${totalFees.toFixed(8)}</strong>
            </div>
            <div className="summary-item">
              <span>Total Transactions</span>
              <strong>{transactions.length}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Fee</th>
                  <th>Chain</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className="type-badge"
                        style={{ backgroundColor: getTypeColor(tx.type) }}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="symbol">{tx.symbol}</td>
                    <td>{parseFloat(tx.amount.toString()).toFixed(4)}</td>
                    <td>${parseFloat(tx.price.toString()).toFixed(2)}</td>
                    <td>${(tx.amount * tx.price).toFixed(2)}</td>
                    <td>{tx.fee ? parseFloat(tx.fee.toString()).toFixed(8) : '-'}</td>
                    <td>{tx.chain}</td>
                    <td>{tx.notes || '-'}</td>
                    <td className="actions">
                      <button className="btn-icon" onClick={() => handleEdit(tx)} title="Edit">
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(tx.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
