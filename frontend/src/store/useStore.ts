import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface Portfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  allTimeReturn: number;
}

interface PriceUpdate {
  price: number;
  change24h: number;
  timestamp: string;
}

interface AppState {
  user: User | null;
  portfolio: Portfolio | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  prices: Record<string, PriceUpdate>;
  setUser: (user: User | null) => void;
  setPortfolio: (portfolio: Portfolio | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPriceUpdate: (symbol: string, priceData: PriceUpdate) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  portfolio: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  prices: {},
  setUser: (user) => set({ user }),
  setPortfolio: (portfolio) => set({ portfolio }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPriceUpdate: (symbol, priceData) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [symbol]: priceData,
      },
    })),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, portfolio: null });
  },
}));
