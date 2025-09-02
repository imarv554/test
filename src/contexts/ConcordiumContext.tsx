import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { detectConcordiumProvider, WalletApi } from "@concordium/browser-wallet-api-helpers";
import { IdStatement, IdProofOutput } from "@concordium/web-sdk";

type VerificationTier = 'basic' | 'full' | 'professional';

interface VerificationStatus {
  isVerified: boolean;
  tier: VerificationTier | null;
  verifiedAt: Date | null;
  attributes: {
    nationality?: string;
    ageOver18?: boolean;
    ageOver21?: boolean;
    dob?: string;
  };
}

interface ConcordiumState {
  provider: WalletApi | null;
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMainnet: boolean;
  verificationStatus: VerificationStatus;
}

interface ConcordiumContextType {
  state: ConcordiumState;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  verifyAge: (minimumAge: number) => Promise<boolean>;
  verifyIdentity: (tier: VerificationTier) => Promise<boolean>;
  getAccountAddress: () => string | null;
}

const MAINNET_GENESIS_HASH = "4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796";

const initialState: ConcordiumState = {
  provider: null,
  account: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  isMainnet: false,
  verificationStatus: {
    isVerified: false,
    tier: null,
    verifiedAt: null,
    attributes: {}
  }
};

const ConcordiumContext = createContext<ConcordiumContextType | undefined>(undefined);

export function ConcordiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConcordiumState>(initialState);

  // Initialize provider detection on mount
  useEffect(() => {
    const initProvider = async () => {
      try {
        console.log('Checking for window.concordium:', (window as any).concordium);
        if (!(window as any).concordium) {
          setState(prev => ({ 
            ...prev, 
            error: 'Concordium Browser Wallet extension not detected. Please install and enable it.' 
          }));
          return;
        }

        const provider = await detectConcordiumProvider(5000); // Increased timeout to 5s
        console.log('Concordium Browser Wallet provider detected:', provider);

        const chainHash = await provider.getSelectedChain();
        const isMainnet = chainHash === MAINNET_GENESIS_HASH;

        setState(prev => ({ ...prev, provider, isMainnet }));

        if (!isMainnet) {
          setState(prev => ({ ...prev, error: 'Please switch to Concordium Mainnet in your wallet.' }));
        }

        // Check if already connected
        const account = await provider.getMostRecentlyUsedAccount();
        if (account) {
          setState(prev => ({ ...prev, account, isConnected: true }));
          console.log('Auto-connected to account:', account);
        }
      } catch (error: any) {
        console.error('Failed to initialize Concordium provider:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'Failed to detect Concordium Browser Wallet. Please ensure it is installed.'
        }));
      }
    };

    initProvider();

    // Cleanup event listeners on unmount
    return () => {
      if (state.provider) {
        state.provider.removeAllListeners();
      }
    };
  }, []);

  // Generate a random hex challenge (32 bytes)
  const generateChallenge = (): string => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const connect = async () => {
    console.log('Starting wallet connection');
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    let provider = state.provider;

    if (!provider) {
      try {
        console.log('Detecting provider');
        provider = await detectConcordiumProvider(5000); // Increased timeout
        console.log('Provider detected:', provider);

        const chainHash = await provider.getSelectedChain();
        const isMainnet = chainHash === MAINNET_GENESIS_HASH;

        setState(prev => ({ ...prev, provider, isMainnet }));

        if (!isMainnet) {
          setState(prev => ({ 
            ...prev, 
            isConnecting: false, 
            error: 'Please switch to Concordium Mainnet in your wallet.' 
          }));
          return;
        }
      } catch (error: any) {
        console.error('Failed to detect provider:', error);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: error.message || 'Concordium Browser Wallet not detected. Please install it.'
        }));
        return;
      }
    }

    try {
      console.log('Attempting to connect wallet');
      const account = await provider.connect();
      console.log('Connection result:', account);
      if (account) {
        setState(prev => ({ ...prev, account, isConnected: true, isConnecting: false }));
        console.log('Connected to Concordium account:', account);

        // Set up event listeners
        provider.on('accountChanged', handleAccountChange);
        provider.on('accountDisconnected', handleAccountDisconnected);
        provider.on('chainChanged', handleChainChanged);
      } else {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: 'Connection rejected by user.' 
        }));
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message || 'Failed to connect wallet. Please try again.'
      }));
    }
  };

  const handleAccountChange = async (account: string) => {
    try {
      console.log('Account changed to:', account);
      const chainHash = await state.provider?.getSelectedChain();
      const isMainnet = chainHash === MAINNET_GENESIS_HASH;
      setState(prev => ({ ...prev, account, isConnected: true, isMainnet }));
    } catch (error: any) {
      console.error('Error handling account change:', error);
      setState(prev => ({ ...prev, error: 'Failed to handle account change.' }));
    }
  };

  const handleAccountDisconnected = () => {
    console.log('Account disconnected');
    setState(prev => ({
      ...prev,
      account: null,
      isConnected: false,
    }));
  };

  const handleChainChanged = async (chainHash: string) => {
    console.log('Chain changed:', chainHash);
    const isMainnet = chainHash === MAINNET_GENESIS_HASH;
    setState(prev => ({ ...prev, isMainnet }));
    if (!isMainnet) {
      setState(prev => ({ ...prev, error: 'Please switch to Concordium Mainnet in your wallet.' }));
    }
  };

  const disconnect = () => {
    console.log('Disconnecting wallet');
    if (state.provider) {
      state.provider.removeListener('accountChanged', handleAccountChange);
      state.provider.removeListener('accountDisconnected', handleAccountDisconnected);
      state.provider.removeListener('chainChanged', handleChainChanged);
    }
    setState(prev => ({
      ...prev,
      account: null,
      isConnected: false,
      error: null,
    }));

    // Re-initialize provider after disconnect
    const initProvider = async () => {
      try {
        console.log('Re-initializing provider after disconnect');
        const provider = await detectConcordiumProvider(5000);
        console.log('Provider detected:', provider);

        const chainHash = await provider.getSelectedChain();
        const isMainnet = chainHash === MAINNET_GENESIS_HASH;

        setState(prev => ({ ...prev, provider, isMainnet }));

        if (!isMainnet) {
          setState(prev => ({ ...prev, error: 'Please switch to Concordium Mainnet in your wallet.' }));
        }
      } catch (error: any) {
        console.error('Failed to detect provider after disconnect:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'Concordium Browser Wallet not detected. Please install it.'
        }));
      }
    };

    initProvider();
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!state.provider || !state.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const hexMessage = Buffer.from(message).toString('hex');
      const signature = await state.provider.signMessage(state.account, hexMessage);
      return signature.hex;
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  };

  const verifyAge = async (minimumAge: number): Promise<boolean> => {
    if (!state.provider || !state.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const today = new Date();
      const upperDate = new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());
      const upperStr = upperDate.toISOString().slice(0, 10).replace(/-/g, '');

      const statement: IdStatement = [
        {
          type: 'AttributeInRange',
          attributeTag: 'dob',
          lower: '19000101',
          upper: upperStr
        }
      ];

      const challenge = generateChallenge();
      const proof: IdProofOutput = await state.provider.requestIdProof(state.account, statement, challenge);

      if (proof) {
        console.log('Zero-knowledge age verification completed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Age verification failed:', error);
      return false;
    }
  };

  const verifyIdentity = async (tier: VerificationTier): Promise<boolean> => {
    if (!state.provider || !state.account) {
      throw new Error('Wallet not connected');
    }

    try {
      let statement: IdStatement = [];

      switch (tier) {
        case 'basic':
          return true;

        case 'full':
          statement = [
            {
              type: 'RevealAttribute',
              attributeTag: 'nationality'
            }
          ];
          break;

        case 'professional':
          statement = [
            {
              type: 'RevealAttribute',
              attributeTag: 'nationality'
            },
            {
              type: 'RevealAttribute',
              attributeTag: 'dob'
            }
          ];
          break;

        default:
          throw new Error('Invalid verification tier');
      }

      const challenge = generateChallenge();
      const proof: IdProofOutput = await state.provider.requestIdProof(state.account, statement, challenge);

      if (proof) {
        const attributes: VerificationStatus['attributes'] = {};

        if (proof.attributeValues?.nationality) {
          attributes.nationality = proof.attributeValues.nationality;
        }

        if (tier === 'professional' && proof.attributeValues?.dob) {
          attributes.dob = proof.attributeValues.dob;

          const birthDate = new Date(
            parseInt(attributes.dob.slice(0, 4)),
            parseInt(attributes.dob.slice(4, 6)) - 1,
            parseInt(attributes.dob.slice(6, 8))
          );
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear() - 
            ((today.getMonth() < birthDate.getMonth() || 
              (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);

          attributes.ageOver18 = age >= 18;
          attributes.ageOver21 = age >= 21;
        }

        setState(prev => ({
          ...prev,
          verificationStatus: {
            isVerified: true,
            tier,
            verifiedAt: new Date(),
            attributes
          }
        }));
        
        console.log(`Identity verification completed for tier: ${tier}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Identity verification failed:', error);
      setState(prev => ({
        ...prev,
        error: `Identity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  };

  const getAccountAddress = (): string | null => {
    return state.account;
  };

  const contextValue: ConcordiumContextType = {
    state,
    connect,
    disconnect,
    signMessage,
    verifyAge,
    verifyIdentity,
    getAccountAddress,
  };

  return (
    <ConcordiumContext.Provider value={contextValue}>
      {children}
    </ConcordiumContext.Provider>
  );
}

export function useConcordium() {
  const context = useContext(ConcordiumContext);
  if (context === undefined) {
    throw new Error('useConcordium must be used within a ConcordiumProvider');
  }
  return context;
}

export type { ConcordiumState };