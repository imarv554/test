import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Avalanche mainnet configuration
const AVALANCHE_MAINNET = {
  chainId: '0xa86a', // 43114 in hex
  chainName: 'Avalanche Network',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};

// State interface
interface AvalancheState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  loading: boolean;
  error: string | null;
}

// Action types
type AvalancheAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CONNECTED'; account: string; provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_BALANCE'; balance: string };

// Initial state
const initialState: AvalancheState = {
  isConnected: false,
  account: null,
  balance: null,
  provider: null,
  signer: null,
  loading: false,
  error: null,
};

// Reducer
function avalancheReducer(state: AvalancheState, action: AvalancheAction): AvalancheState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        account: action.account,
        provider: action.provider,
        signer: action.signer,
        loading: false,
        error: null,
      };
    case 'SET_DISCONNECTED':
      return {
        ...initialState,
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.balance };
    default:
      return state;
  }
}

// Context interface
interface AvalancheContextType {
  state: AvalancheState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToAvalanche: () => Promise<void>;
  sendTransaction: (to: string, amount: string, gasLimit?: string) => Promise<string>;
}

const AvalancheContext = createContext<AvalancheContextType | undefined>(undefined);

// Provider component
export function AvalancheProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(avalancheReducer, initialState);

  // Check if MetaMask is available
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use AVAX payments.');
    }
    return true;
  };

  // Connect wallet
  const connect = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      checkMetaMask();
      
      // Request account access
      await window.ethereum!.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      // Check if we're on Avalanche network
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(43114)) {
        await switchToAvalanche();
      }
      
      dispatch({ type: 'SET_CONNECTED', account, provider, signer });
      
      // Get balance
      await updateBalance(provider, account);
      
    } catch (error) {
      console.error('Failed to connect Avalanche wallet:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        error: error instanceof Error ? error.message : 'Failed to connect wallet' 
      });
    }
  };

  // Switch to Avalanche network
  const switchToAvalanche = async () => {
    try {
      checkMetaMask();
      
      // Try to switch to Avalanche
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AVALANCHE_MAINNET.chainId }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [AVALANCHE_MAINNET],
          });
        } catch (addError) {
          console.error('Failed to add Avalanche network:', addError);
          throw new Error('Failed to add Avalanche network');
        }
      } else {
        console.error('Failed to switch to Avalanche network:', switchError);
        throw new Error('Failed to switch to Avalanche network');
      }
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    dispatch({ type: 'SET_DISCONNECTED' });
  };

  // Update balance
  const updateBalance = async (provider: ethers.BrowserProvider, account: string) => {
    try {
      const balance = await provider.getBalance(account);
      const balanceInAvax = ethers.formatEther(balance);
      dispatch({ type: 'SET_BALANCE', balance: balanceInAvax });
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  // Send transaction
  const sendTransaction = async (to: string, amount: string, gasLimit = '21000'): Promise<string> => {
    if (!state.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = {
        to,
        value: ethers.parseEther(amount),
        gasLimit: BigInt(gasLimit),
      };

      const transaction = await state.signer.sendTransaction(tx);
      
      // Wait for confirmation
      await transaction.wait();
      
      return transaction.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  // Handle account/network changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (state.isConnected && accounts[0] !== state.account) {
          // Reconnect with new account
          connect();
        }
      };

      // Handle network changes
      const handleChainChanged = (chainId: string) => {
        if (state.isConnected) {
          // If not on Avalanche, disconnect or prompt to switch
          if (parseInt(chainId, 16) !== 43114) {
            console.log('Switched away from Avalanche network');
          } else {
            // Refresh connection
            connect();
          }
        }
      };

      const ethereum = window.ethereum;
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [state.isConnected, state.account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  const contextValue: AvalancheContextType = {
    state,
    connect,
    disconnect,
    switchToAvalanche,
    sendTransaction,
  };

  return (
    <AvalancheContext.Provider value={contextValue}>
      {children}
    </AvalancheContext.Provider>
  );
}

// Hook to use Avalanche context
export function useAvalanche(): AvalancheContextType {
  const context = useContext(AvalancheContext);
  if (context === undefined) {
    throw new Error('useAvalanche must be used within an AvalancheProvider');
  }
  return context;
}

// Add MetaMask types to global window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}