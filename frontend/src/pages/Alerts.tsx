import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/Alerts.css';

interface Alert {
  id: string;
  type: 'price' | 'portfolio' | 'position' | 'transaction';
  name: string;
  symbol?: string;
  condition?: 'above' | 'below' | 'change_percent';
  targetPrice?: number;
  changePercent?: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  notes?: string;
  createdAt: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'price',
    name: '',
    symbol: '',
    condition: 'above',
    targetPrice: '',
    changePercent: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.getAlerts();
      setAlerts(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const data = {
        type: formData.type,
        name: formData.name,
        symbol: formData.symbol || undefined,
        condition: formData.condition || undefined,
        targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
        changePercent: formData.changePercent ? parseFloat(formData.changePercent) : undefined,
        notes: formData.notes || undefined,
      };

      if (editing) {
        await api.updateAlert(editing, data);
        setSuccess('Alert updated successfully');
        setEditing(null);
      } else {
        await api.createAlert(data);
        setSuccess('Alert created successfully');
      }
      resetForm();
      await fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save alert');
    }
  };

  const handleEdit = (alert: Alert) => {
    setFormData({
      type: alert.type,
      name: alert.name,
      symbol: alert.symbol || '',
      condition: alert.condition || 'above',
      targetPrice: alert.targetPrice?.toString() || '',
      changePercent: alert.changePercent?.toString() || '',
      notes: alert.notes || '',
    });
    setEditing(alert.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deleteAlert(id);
      setSuccess('Alert deleted successfully');
      await fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete alert');
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    try {
      await api.updateAlert(id, { isActive: !isActive });
      setSuccess(isActive ? 'Alert disabled' : 'Alert enabled');
      await fetchAlerts();
    } catch (err: any) {
      setError('Failed to toggle alert');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({
      type: 'price',
      name: '',
      symbol: '',
      condition: 'above',
      targetPrice: '',
      changePercent: '',
      notes: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price':
        return '#f59e0b';
      case 'portfolio':
        return '#667eea';
      case 'position':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (isTriggered: boolean) => {
    return isTriggered ? '#ef4444' : '#10b981';
  };

  const activeAlerts = alerts.filter((a) => a.isActive).length;
  const triggeredAlerts = alerts.filter((a) => a.isTriggered).length;

  return (
    <>
      <Navigation />
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>Price Alerts</h1>
          <button
            className="btn-primary"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? 'Cancel' : '+ Add Alert'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <div className="alert-form">
            <h2>{editing ? 'Edit Alert' : 'Create New Alert'}</h2>
            <form onSubmit={handleAddAlert}>
              <div className="form-row">
                <div className="form-group">
                  <label>Alert Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="price">Price Alert</option>
                    <option value="portfolio">Portfolio Alert</option>
                    <option value="position">Position Alert</option>
                    <option value="transaction">Transaction Alert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Alert Name</label>
                  <input
                    type="text"
                    placeholder="e.g., ETH reaches $2000"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.type === 'price' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Symbol</label>
                    <input
                      type="text"
                      placeholder="ETH"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    >
                      <option value="above">Price Above</option>
                      <option value="below">Price Below</option>
                      <option value="change_percent">Change %</option>
                    </select>
                  </div>

                  {formData.condition !== 'change_percent' && (
                    <div className="form-group">
                      <label>Target Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="2000"
                        value={formData.targetPrice}
                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      />
                    </div>
                  )}

                  {formData.condition === 'change_percent' && (
                    <div className="form-group">
                      <label>Change %</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="10"
                        value={formData.changePercent}
                        onChange={(e) => setFormData({ ...formData, changePercent: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Create'} Alert
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="alerts-summary">
            <div className="summary-item">
              <span>Active Alerts</span>
              <strong>{activeAlerts}</strong>
            </div>
            <div className="summary-item">
              <span>Triggered</span>
              <strong style={{ color: '#ef4444' }}>{triggeredAlerts}</strong>
            </div>
            <div className="summary-item">
              <span>Total Alerts</span>
              <strong>{alerts.length}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <p>No alerts yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="alerts-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Condition</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="name">{alert.name}</td>
                    <td>
                      <span className="type-badge" style={{ backgroundColor: getTypeColor(alert.type) }}>
                        {alert.type.toUpperCase()}
                      </span>
                    </td>
                    <td>{alert.symbol || '-'}</td>
                    <td>{alert.condition || '-'}</td>
                    <td>
                      {alert.targetPrice ? `$${alert.targetPrice.toFixed(2)}` : alert.changePercent ? `${alert.changePercent}%` : '-'}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(alert.isTriggered),
                        }}
                      >
                        {alert.isTriggered ? 'TRIGGERED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className={`btn-toggle ${!alert.isActive ? 'disabled' : ''}`}
                        onClick={() => toggleAlert(alert.id, alert.isActive)}
                        title={alert.isActive ? 'Disable' : 'Enable'}
                      >
                        {alert.isActive ? '🔔' : '🔕'}
                      </button>
                      <button className="btn-icon" onClick={() => handleEdit(alert)} title="Edit">
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(alert.id)}
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
