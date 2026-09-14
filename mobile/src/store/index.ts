import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Portfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
}

interface AppState {
  user: User | null;
  portfolio: Portfolio | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setPortfolio: (portfolio: Portfolio | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useStore = create<AppState>(async (set) => {
  const token = await AsyncStorage.getItem('token');

  return {
    user: null,
    portfolio: null,
    token,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),
    setPortfolio: (portfolio) => set({ portfolio }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    login: async (email, password) => {
      set({ loading: true });
      try {
        const result = await api.login(email, password);
        set({ user: result.user, token: result.token, error: null });
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    register: async (email, password, firstName, lastName) => {
      set({ loading: true });
      try {
        const result = await api.register(email, password, firstName, lastName);
        set({ user: result.user, token: result.token, error: null });
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    logout: async () => {
      await api.logout();
      set({ user: null, token: null, portfolio: null });
    },

    loadToken: async () => {
      const token = await AsyncStorage.getItem('token');
      set({ token });
    },
  };
});
