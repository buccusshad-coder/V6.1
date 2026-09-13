import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

export default function Navigation() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          📊 Tracker v7
        </Link>

        <ul className="nav-menu">
          <li>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/wallets" className="nav-link">
              Wallets
            </Link>
          </li>
          <li>
            <Link to="/positions" className="nav-link">
              Holdings
            </Link>
          </li>
          <li>
            <Link to="/transactions" className="nav-link">
              Transactions
            </Link>
          </li>
          <li>
            <Link to="/portfolio" className="nav-link">
              Portfolio
            </Link>
          </li>
          <li>
            <Link to="/alerts" className="nav-link">
              Alerts
            </Link>
          </li>
        </ul>

        <button className="nav-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
