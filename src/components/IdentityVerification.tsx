import React, { useState } from 'react';
import { useConcordium } from '../contexts/ConcordiumContext';

interface IdentityVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete?: (tier: string) => void;
}

const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const { state, connect, verifyIdentity } = useConcordium();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'full' | 'professional' | null>(null);

  if (!isOpen) return null;

  const handleVerification = async (tier: 'basic' | 'full' | 'professional') => {
    try {
      setIsVerifying(true);
      setSelectedTier(tier);

      // Connect wallet if not already connected
      if (!state.isConnected) {
        await connect();
      }

      // Perform identity verification
      const success = await verifyIdentity(tier);
      
      if (success) {
        onVerificationComplete?.(tier);
        onClose();
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
      setSelectedTier(null);
    }
  };

  const verificationTiers = [
    {
      id: 'basic',
      name: 'Basic Verification',
      description: 'Quick verification with minimal data sharing. Perfect for basic marketplace access.',
      features: [
        'Access to all products',
        'Basic buyer protection',
        'Community features'
      ],
      privacy: 'No personal information revealed',
      icon: '🔒'
    },
    {
      id: 'full',
      name: 'Full Verification', 
      description: 'Enhanced verification for premium features. Reveals nationality for compliance.',
      features: [
        'All Basic features',
        'Premium seller status',
        'Advanced marketplace tools',
        'Priority customer support'
      ],
      privacy: 'Country of residence revealed',
      icon: '🏅'
    },
    {
      id: 'professional',
      name: 'Professional Verification',
      description: 'Complete verification for business users. Includes age verification for restricted products.',
      features: [
        'All Full features',
        'Business seller privileges',
        'Age-restricted product access',
        'Enterprise support'
      ],
      privacy: 'Date of birth and nationality revealed',
      icon: '👑'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isVerifying}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!state.isConnected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              You need to connect your Concordium wallet to proceed with identity verification.
            </p>
          </div>
        )}

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{state.error}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">How it works</h3>
          <p className="text-gray-600 mb-4">
            Credify uses Concordium's Web3 ID system for privacy-preserving identity verification. 
            Your personal information stays in your wallet - we only receive cryptographic proofs 
            that verify your eligibility without exposing your private data.
          </p>
        </div>

        <div className="space-y-4">
          {verificationTiers.map((tier) => (
            <div
              key={tier.id}
              className={`border rounded-lg p-6 transition-all ${
                state.verificationStatus.tier === tier.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{tier.icon}</span>
                    <h4 className="text-xl font-semibold">{tier.name}</h4>
                    {state.verificationStatus.tier === tier.id && (
                      <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Features included:</h5>
                      <ul className="space-y-1">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Privacy:</h5>
                      <p className="text-sm text-gray-600">{tier.privacy}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6">
                  {state.verificationStatus.tier === tier.id ? (
                    <div className="text-center">
                      <div className="text-green-600 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-600 font-medium">Verified</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerification(tier.id as any)}
                      disabled={isVerifying || !state.provider}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isVerifying && selectedTier === tier.id
                          ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                          : isVerifying
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : !state.provider
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isVerifying && selectedTier === tier.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        'Get Verified'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-2">Security & Privacy</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Zero-knowledge proofs protect your personal information</li>
            <li>• Your data never leaves your Concordium wallet</li>
            <li>• Cryptographic verification ensures authenticity without exposure</li>
            <li>• You can upgrade your verification level at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification;