import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../services/api';
import '../styles/Wallets.css';

interface Wallet {
  id: string;
  username?: string;
  name: string;
  address: string;
  chain?: string; // primary for backwards compat
  chains?: string[]; // new: multiple chains
  type: string;
  balance: number;
  createdAt: string;
}

export default function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    solanaAddress: '',
    evmAddress: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await api.getWallets();
      setWallets(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const { username, solanaAddress, evmAddress } = formData;

      if (!username) {
        setError('Username is required');
        return;
      }
      if (!solanaAddress && !evmAddress) {
        setError('At least one wallet address is required (Solana or EVM)');
        return;
      }

      // Create Solana wallet if address provided
      if (solanaAddress) {
        await api.createWallet({
          username,
          name: `${username} (SOL)`,
          address: solanaAddress,
        });
      }

      // Create EVM wallet if address provided
      if (evmAddress) {
        await api.createWallet({
          username,
          name: `${username} (EVM)`,
          address: evmAddress,
        });
      }

      setSuccess(`Wallets created successfully for ${username}`);
      setFormData({ username: '', solanaAddress: '', evmAddress: '' });
      await fetchWallets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wallets');
    }
  };

  const handleEdit = (wallet: Wallet) => {
    const isSolana = wallet.type === 'solana';
    setFormData({
      username: wallet.username || '',
      solanaAddress: isSolana ? wallet.address : '',
      evmAddress: !isSolana ? wallet.address : '',
    });
    setEditing(wallet.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deleteWallet(id);
      setSuccess('Wallet deleted successfully');
      await fetchWallets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete wallet');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ username: '', solanaAddress: '', evmAddress: '' });
    setError('');
  };

  const handleScanWallet = async (walletId: string) => {
    try {
      setError('');
      await api.scanWallet(walletId);
      navigate(`/wallets/${walletId}/portfolio`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scan wallet');
    }
  };

  const CHAIN_COLORS: Record<string, string> = {
    ethereum: '#627eea',
    arbitrum: '#28a0f0',
    base: '#0052ff',
    solana: '#14f195',
    polygon: '#8247e5',
    optimism: '#ff0420',
  };

  return (
    <>
      <Navigation />
      <div className="wallets-container">
      <div className="wallets-header">
        <h1>My Wallets</h1>
        <button
          className="btn-primary"
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
        >
          {showForm ? 'Cancel' : '+ Add Wallet'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="wallet-form">
          <h2>{editing ? 'Edit Wallet' : 'Add New Wallet'}</h2>
          <form onSubmit={handleAddWallet}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="e.g., john_doe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Solana Wallet Address (Optional)</label>
              <input
                type="text"
                placeholder="e.g., 3J98t1WnwEjsnkYXLB1QNLsNgPDMzcBkSfh8HWqGrJwN"
                value={formData.solanaAddress}
                onChange={(e) => setFormData({ ...formData, solanaAddress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>EVM Wallet Address (Optional)</label>
              <input
                type="text"
                placeholder="e.g., 0x742d35Cc6634C0532925a3b844Bc369e4471243D"
                value={formData.evmAddress}
                onChange={(e) => setFormData({ ...formData, evmAddress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <p style={{ fontSize: '12px', color: '#666', marginTop: '-8px' }}>
                💡 Create one or both wallet types. EVM automatically creates wallets for ethereum, arbitrum, base, polygon, optimism
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editing ? 'Update' : 'Create'} Wallets
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Separate Add Wallet Box - ALWAYS VISIBLE */}
      <div className="add-new-wallet-box" onClick={() => setShowForm(true)}>
        <div className="add-wallet-content">
          <div className="add-wallet-icon">+</div>
          <h3>Add New Wallet</h3>
          <p>Click to add a new wallet</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading wallets...</div>
      ) : wallets.length === 0 ? (
        <div className="empty-state">
          <p>No wallets yet. Add one to get started!</p>
        </div>
      ) : (
        <>
          <div className="wallets-grid">
            {/* Existing Wallets */}
            {wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-card">
              <div className="wallet-header-card">
                <div>
                  <h3>{wallet.name}</h3>
                  <div className="wallet-chains">
                    {(wallet.chains || [wallet.chain || 'ethereum']).map((chain) => (
                      <span
                        key={chain}
                        className="chain-badge"
                        style={{ backgroundColor: CHAIN_COLORS[chain || 'ethereum'], color: '#fff', marginRight: '4px' }}
                      >
                        {(chain || 'ethereum').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="wallet-actions">
                  <button className="btn-icon" onClick={() => handleEdit(wallet)} title="Edit">
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(wallet.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="wallet-address">
                <code>
                  {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                </code>
              </div>

              <div className="wallet-balance">
                <span>Balance</span>
                <strong>${parseFloat(wallet.balance.toString()).toFixed(2)}</strong>
              </div>

              <div className="wallet-footer">
                <small>Added {new Date(wallet.createdAt).toLocaleDateString()}</small>
                <button
                  className="btn-scan"
                  onClick={() => handleScanWallet(wallet.id)}
                  title="Scan wallet for tokens"
                >
                  🔍 Scan
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
      </div>

      {/* Floating Action Button to add wallet */}
      {wallets.length > 0 && (
        <button
          className="fab-add-wallet"
          onClick={() => setShowForm(true)}
          title="Add another wallet"
        >
          +
        </button>
      )}
    </>
  );
}
