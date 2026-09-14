import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

export const usePriceStream = (symbols: string[]) => {
  const socketRef = useRef<Socket | null>(null);
  const { setPriceUpdate } = useStore();

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const WEBSOCKET_URL = API_URL.replace('/api', '');

    socketRef.current = io(`${WEBSOCKET_URL}/prices`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to price stream');
      symbols.forEach((symbol) => {
        socketRef.current?.emit('subscribe-symbol', symbol);
      });
    });

    socketRef.current.on('price-update', (data) => {
      console.log(`Price update for ${data.symbol}:`, data.price);
      setPriceUpdate(data.symbol, {
        price: data.price,
        change24h: data.change24h,
        timestamp: data.timestamp,
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from price stream');
    });

    return () => {
      symbols.forEach((symbol) => {
        socketRef.current?.emit('unsubscribe-symbol', symbol);
      });
      socketRef.current?.disconnect();
    };
  }, [symbols, setPriceUpdate]);

  return socketRef.current;
};
