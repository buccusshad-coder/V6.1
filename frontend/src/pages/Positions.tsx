import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/Positions.css';

interface Position {
  id: string;
  symbol: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  chain: string;
  walletId: string;
  createdAt: string;
}

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    walletId: '',
    symbol: '',
    amount: '',
    entryPrice: '',
    currentPrice: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    fetchPositions();
    fetchWallets();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await api.getPositions();
      setPositions(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load positions');
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

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const data = {
        walletId: formData.walletId,
        symbol: formData.symbol,
        amount: parseFloat(formData.amount),
        entryPrice: parseFloat(formData.entryPrice),
        currentPrice: parseFloat(formData.currentPrice),
      };

      if (editing) {
        await api.updatePosition(editing, data);
        setSuccess('Position updated successfully');
        setEditing(null);
      } else {
        await api.createPosition(data);
        setSuccess('Position added successfully');
      }
      setFormData({ walletId: '', symbol: '', amount: '', entryPrice: '', currentPrice: '' });
      setShowForm(false);
      await fetchPositions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save position');
    }
  };

  const handleEdit = (position: Position) => {
    setFormData({
      walletId: position.walletId,
      symbol: position.symbol,
      amount: position.amount.toString(),
      entryPrice: position.entryPrice.toString(),
      currentPrice: position.currentPrice.toString(),
    });
    setEditing(position.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deletePosition(id);
      setSuccess('Position deleted successfully');
      await fetchPositions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete position');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ walletId: '', symbol: '', amount: '', entryPrice: '', currentPrice: '' });
    setError('');
  };

  const calculatePnL = (position: Position) => {
    const cost = position.amount * position.entryPrice;
    const current = position.amount * position.currentPrice;
    return current - cost;
  };

  const calculatePnLPercent = (position: Position) => {
    const cost = position.entryPrice;
    if (cost === 0) return 0;
    return ((position.currentPrice - cost) / cost) * 100;
  };

  const totalValue = positions.reduce(
    (sum, pos) => sum + pos.amount * pos.currentPrice,
    0,
  );

  const totalCost = positions.reduce(
    (sum, pos) => sum + pos.amount * pos.entryPrice,
    0,
  );

  const totalPnL = totalValue - totalCost;

  return (
    <>
      <Navigation />
      <div className="positions-container">
        <div className="positions-header">
          <h1>Holdings</h1>
          <button
            className="btn-primary"
            onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          >
            {showForm ? 'Cancel' : '+ Add Position'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <div className="position-form">
            <h2>{editing ? 'Edit Position' : 'Add New Position'}</h2>
            <form onSubmit={handleAddPosition}>
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
                      {wallet.name} ({wallet.chain.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Symbol (e.g., ETH, BTC)</label>
                <input
                  type="text"
                  placeholder="ETH"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  required
                />
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
                  <label>Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1500"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Current Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2000"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Add'} Position
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {positions.length > 0 && (
          <div className="positions-summary">
            <div className="summary-item">
              <span>Total Value</span>
              <strong>${totalValue.toFixed(2)}</strong>
            </div>
            <div className="summary-item">
              <span>Total Cost</span>
              <strong>${totalCost.toFixed(2)}</strong>
            </div>
            <div className={`summary-item ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              <span>Total PnL</span>
              <strong>${totalPnL.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading positions...</div>
        ) : positions.length === 0 ? (
          <div className="empty-state">
            <p>No positions yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="positions-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Amount</th>
                  <th>Entry Price</th>
                  <th>Current Price</th>
                  <th>Cost Basis</th>
                  <th>Current Value</th>
                  <th>PnL</th>
                  <th>PnL %</th>
                  <th>Wallet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.id}>
                    <td className="symbol">{position.symbol}</td>
                    <td>{parseFloat(position.amount.toString()).toFixed(4)}</td>
                    <td>${parseFloat(position.entryPrice.toString()).toFixed(2)}</td>
                    <td>${parseFloat(position.currentPrice.toString()).toFixed(2)}</td>
                    <td>${(position.amount * position.entryPrice).toFixed(2)}</td>
                    <td>${(position.amount * position.currentPrice).toFixed(2)}</td>
                    <td className={calculatePnL(position) >= 0 ? 'positive' : 'negative'}>
                      ${calculatePnL(position).toFixed(2)}
                    </td>
                    <td className={calculatePnLPercent(position) >= 0 ? 'positive' : 'negative'}>
                      {calculatePnLPercent(position).toFixed(2)}%
                    </td>
                    <td>{wallets.find((w) => w.id === position.walletId)?.name || 'Unknown'}</td>
                    <td className="actions">
                      <button className="btn-icon" onClick={() => handleEdit(position)} title="Edit">
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(position.id)}
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
