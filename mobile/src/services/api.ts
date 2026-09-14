import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api'; // Change for production

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          AsyncStorage.removeItem('token');
        }
        return Promise.reject(error);
      },
    );
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await this.api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  }

  async getProfile() {
    return this.api.get('/auth/profile');
  }

  // Wallets
  async getWallets() {
    return this.api.get('/wallets');
  }

  async createWallet(data: any) {
    return this.api.post('/wallets', data);
  }

  async updateWallet(id: string, data: any) {
    return this.api.put(`/wallets/${id}`, data);
  }

  async deleteWallet(id: string) {
    return this.api.delete(`/wallets/${id}`);
  }

  // Positions
  async getPositions() {
    return this.api.get('/positions');
  }

  async createPosition(data: any) {
    return this.api.post('/positions', data);
  }

  async updatePosition(id: string, data: any) {
    return this.api.put(`/positions/${id}`, data);
  }

  async deletePosition(id: string) {
    return this.api.delete(`/positions/${id}`);
  }

  // Portfolio
  async getPortfolioOverview() {
    return this.api.get('/portfolio/overview');
  }

  async getPortfolioAnalytics() {
    return this.api.get('/portfolio/analytics');
  }

  // Prices
  async getPrice(symbol: string) {
    return this.api.get(`/prices/${symbol}`);
  }

  // Analytics
  async getAnalytics() {
    return this.api.get('/analytics/portfolio');
  }

  async logout() {
    await AsyncStorage.removeItem('token');
  }
}

export const api = new ApiService();
