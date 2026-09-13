import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="container">
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>Settings</h1>

      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        <div style={{ width: '200px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '10px 15px',
                background: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'profile' ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'profile' ? '500' : '400',
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                padding: '10px 15px',
                background: activeTab === 'notifications' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'notifications' ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'notifications' ? '500' : '400',
              }}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                padding: '10px 15px',
                background: activeTab === 'security' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'security' ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'security' ? '500' : '400',
              }}
            >
              Security
            </button>
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <h2>Profile Settings</h2>
              <div style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.com" disabled />
                </div>
                <button className="button button-primary">Update Profile</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2>Notification Settings</h2>
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="email-alerts" defaultChecked />
                  <label htmlFor="email-alerts" style={{ margin: 0 }}>
                    Email Alerts
                  </label>
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="telegram" />
                  <label htmlFor="telegram" style={{ margin: 0 }}>
                    Telegram Notifications
                  </label>
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="discord" />
                  <label htmlFor="discord" style={{ margin: 0 }}>
                    Discord Webhooks
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2>Security</h2>
              <div style={{ marginTop: '20px' }}>
                <button className="button button-secondary" style={{ marginRight: '10px' }}>
                  Change Password
                </button>
                <button className="button" style={{ background: '#ef4444', color: 'white' }} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
