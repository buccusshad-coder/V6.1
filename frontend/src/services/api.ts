import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = 'https://viewers-purpose-antonio-orange.trycloudflare.com/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth
  register(email: string, password: string, password_confirmation?: string) {
    return this.api.post('/auth/register', {
      email,
      password,
      password_confirmation: password_confirmation || password
    });
  }

  login(email: string, password: string) {
    return this.api.post('/auth/login', { email, password });
  }

  refreshToken() {
    return this.api.post('/auth/refresh', {});
  }

  getProfile() {
    return this.api.get('/auth/profile');
  }

  // Wallets
  getWallets() {
    return this.api.get('/wallets');
  }

  getWallet(id: string) {
    return this.api.get(`/wallets/${id}`);
  }

  createWallet(data: any) {
    return this.api.post('/wallets', data);
  }

  updateWallet(id: string, data: any) {
    return this.api.put(`/wallets/${id}`, data);
  }

  deleteWallet(id: string) {
    return this.api.delete(`/wallets/${id}`);
  }

  scanWallet(id: string) {
    return this.api.post(`/wallets/${id}/scan`, {});
  }

  restoreWallet(id: string) {
    return this.api.post(`/wallets/${id}/restore`, {});
  }

  getDeletedWallets() {
    return this.api.get('/wallets/deleted/all');
  }

  // Positions
  getPositions() {
    return this.api.get('/positions');
  }

  getPosition(id: string) {
    return this.api.get(`/positions/${id}`);
  }

  createPosition(data: any) {
    return this.api.post('/positions', data);
  }

  updatePosition(id: string, data: any) {
    return this.api.put(`/positions/${id}`, data);
  }

  deletePosition(id: string) {
    return this.api.delete(`/positions/${id}`);
  }

  getPositionsByWallet(walletId: string) {
    return this.api.get(`/positions/by-wallet/${walletId}`);
  }

  getPositionsByChain() {
    return this.api.get('/positions/by-chain');
  }

  getPositionsTotalValue() {
    return this.api.get('/positions/total-value');
  }

  // Portfolio
  getPortfolioOverview() {
    return this.api.get('/portfolio/overview');
  }

  getPortfolioAnalytics() {
    return this.api.get('/portfolio/analytics');
  }

  getPortfolioPnL() {
    return this.api.get('/portfolio/pnl');
  }

  getPortfolioHistory() {
    return this.api.get('/portfolio/history');
  }

  getPortfolioByWallet() {
    return this.api.get('/portfolio/by-wallet');
  }

  // Prices
  getPrices() {
    return this.api.get('/prices');
  }

  getPrice(symbol: string) {
    return this.api.get(`/prices/${symbol}`);
  }

  getPriceHistory(symbol: string, range?: string) {
    return this.api.get(`/prices/history/${symbol}`, { params: { range } });
  }

  // Alerts
  getAlerts() {
    return this.api.get('/alerts');
  }

  getAlert(id: string) {
    return this.api.get(`/alerts/${id}`);
  }

  createAlert(data: any) {
    return this.api.post('/alerts', data);
  }

  updateAlert(id: string, data: any) {
    return this.api.put(`/alerts/${id}`, data);
  }

  deleteAlert(id: string) {
    return this.api.delete(`/alerts/${id}`);
  }

  getActiveAlerts() {
    return this.api.get('/alerts/active');
  }

  getTriggeredAlerts() {
    return this.api.get('/alerts/triggered');
  }

  // Transactions
  getTransactions() {
    return this.api.get('/transactions');
  }

  getTransaction(id: string) {
    return this.api.get(`/transactions/${id}`);
  }

  createTransaction(data: any) {
    return this.api.post('/transactions', data);
  }

  updateTransaction(id: string, data: any) {
    return this.api.put(`/transactions/${id}`, data);
  }

  deleteTransaction(id: string) {
    return this.api.delete(`/transactions/${id}`);
  }

  getTransactionsByWallet(walletId: string) {
    return this.api.get(`/transactions/by-wallet/${walletId}`);
  }

  getTransactionsByPosition(positionId: string) {
    return this.api.get(`/transactions/by-position/${positionId}`);
  }

  getRecentTransactions(limit: number = 10) {
    return this.api.get('/transactions/recent', { params: { limit } });
  }

  // Token Tracing
  traceToken(tokenAddress: string, chain: string) {
    return this.api.get(`/tokens/trace/${tokenAddress}/${chain}`);
  }

  getTokenTraceAsTable(tokenAddress: string, chain: string) {
    return this.api.get(`/tokens/trace/${tokenAddress}/${chain}/table`);
  }

  getTraceSummary(tokenAddress: string, chain: string) {
    return this.api.get(`/tokens/trace/${tokenAddress}/${chain}/summary`);
  }

  // Analytics
  getAnalytics(period?: string) {
    return this.api.get('/analytics', { params: { period } });
  }

  // Notifications
  getNotifications() {
    return this.api.get('/notifications');
  }

  markNotificationAsRead(id: string) {
    return this.api.put(`/notifications/${id}/read`, {});
  }
}

const apiService = new ApiService();
export default apiService;
