import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Wallets = React.lazy(() => import('./pages/Wallets'));
const WalletPortfolio = React.lazy(() => import('./pages/WalletPortfolio'));
const Positions = React.lazy(() => import('./pages/Positions'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const TokenTracer = React.lazy(() => import('./pages/TokenTracer'));
const Settings = React.lazy(() => import('./pages/Settings'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <React.Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallets"
            element={
              <PrivateRoute>
                <Wallets />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallets/:id/portfolio"
            element={
              <PrivateRoute>
                <WalletPortfolio />
              </PrivateRoute>
            }
          />
          <Route
            path="/positions"
            element={
              <PrivateRoute>
                <Positions />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PrivateRoute>
                <Portfolio />
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            }
          />
          <Route
            path="/token-tracer"
            element={
              <PrivateRoute>
                <TokenTracer />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}
