'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // Check if Phantom is installed
  const getPhantomProvider = () => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    return null;
  };

  // Connect to Phantom wallet
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      const provider = getPhantomProvider();
      
      if (!provider) {
        // Open Phantom wallet installation page
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not found! Please install Phantom wallet.');
      }

      const response = await provider.connect();
      setPublicKey(response.publicKey.toString());
      setConnected(true);
      
      // Store connection state in localStorage
      localStorage.setItem('phantom-wallet-connected', 'true');
      localStorage.setItem('phantom-wallet-publickey', response.publicKey.toString());
      
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect to Phantom wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect from Phantom wallet
  const disconnect = useCallback(async () => {
    try {
      const provider = getPhantomProvider();
      
      if (provider) {
        await provider.disconnect();
      }
      
      setConnected(false);
      setPublicKey(null);
      
      // Clear connection state from localStorage
      localStorage.removeItem('phantom-wallet-connected');
      localStorage.removeItem('phantom-wallet-publickey');
      
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet:', error);
    }
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = getPhantomProvider();
        
        if (provider) {
          // Check if wallet was previously connected
          const wasConnected = localStorage.getItem('phantom-wallet-connected');
          const storedPublicKey = localStorage.getItem('phantom-wallet-publickey');
          
          if (wasConnected && storedPublicKey) {
            // Try to reconnect silently
            try {
              const response = await provider.connect({ onlyIfTrusted: true });
              setConnected(true);
              setPublicKey(response.publicKey.toString());
            } catch (error) {
              // Silent connection failed, clear stored data
              localStorage.removeItem('phantom-wallet-connected');
              localStorage.removeItem('phantom-wallet-publickey');
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  const value: WalletContextType = {
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};