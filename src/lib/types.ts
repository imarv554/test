// Basic types for CREDIFY MVP
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'CCD';
  images: string[];
  category: {
    id: string;
    name: string;
    requiresVerification: boolean;
  };
  seller: {
    id: string;
    name: string;
    reputationScore: number;
    isVerified: boolean;
  };
  ageRestriction?: {
    minimumAge: 18 | 21;
    requiresZKProof: boolean;
  };
  escrowRequired: boolean;
  inventory: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  shipping: {
    free: boolean;
    cost?: number;
    estimatedDays: number;
  };
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface User {
  id: string;
  concordiumAddress: string;
  isVerified: boolean;
  reputationScore: number;
}