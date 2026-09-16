import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export const useWalletSync = (userId: string, onWalletChange: (event: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const WEBSOCKET_URL = API_URL.replace('/api', '');

    socketRef.current = io(`${WEBSOCKET_URL}/wallets`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      query: {
        userId,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to wallet sync');
    });

    // Listen for wallet events
    socketRef.current.on('wallet-created', (data) => {
      console.log('Wallet created:', data.wallet);
      onWalletChange({ type: 'created', wallet: data.wallet });
    });

    socketRef.current.on('wallet-updated', (data) => {
      console.log('Wallet updated:', data.wallet);
      onWalletChange({ type: 'updated', wallet: data.wallet });
    });

    socketRef.current.on('wallet-deleted', (data) => {
      console.log('Wallet deleted:', data.walletId);
      onWalletChange({ type: 'deleted', walletId: data.walletId });
    });

    socketRef.current.on('wallet-restored', (data) => {
      console.log('Wallet restored:', data.wallet);
      onWalletChange({ type: 'restored', wallet: data.wallet });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from wallet sync');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, onWalletChange]);

  return socketRef.current;
};
