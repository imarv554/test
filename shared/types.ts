// CREDIFY Platform Types
// Identity-First E-commerce with Concordium Integration

export interface User {
  id: string;
  concordiumAddress: string;
  isVerified: boolean;
  reputationScore: number;
  verificationLevel: 'NONE' | 'BASIC' | 'ADVANCED' | 'PREMIUM';
  attributes: {
    isOver18: boolean;
    isOver21: boolean;
    jurisdiction: string;
    businessVerified?: boolean;
  };
  joinedAt: Date;
  lastActive: Date;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'CCD'; // CCD = Concordium
  images: string[];
  vendorWallet?: string;
  category: ProductCategory;
  seller: {
    id: string;
    name: string;
    reputationScore: number;
    isVerified: boolean;
    verificationBadges: VerificationBadge[];
  };
  ageRestriction?: AgeRestriction;
  escrowRequired: boolean;
  escrowThreshold: number;
  inventory: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  shipping: {
    free: boolean;
    cost?: number;
    estimatedDays: number;
    international: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  requiresVerification: boolean;
  allowedJurisdictions?: string[];
}

export interface AgeRestriction {
  minimumAge: 18 | 21;
  requiresZKProof: boolean;
  blockedJurisdictions: string[];
  warningMessage: string;
}

export interface VerificationBadge {
  type: 'IDENTITY' | 'BUSINESS' | 'PREMIUM_SELLER' | 'HIGH_VOLUME' | 'EXPERT';
  issuedAt: Date;
  expiresAt?: Date;
  issuer: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  addedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  attributes: Record<string, string>; // color: "red", size: "L"
  priceModifier: number; // +/- amount
  inventory: number;
}

export interface Order {
  id: string;
  buyer: User;
  seller: User;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  escrowContract?: string; // Smart contract address
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  tracking?: TrackingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  variant?: ProductVariant;
}

export type OrderStatus = 
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ESCROW_FUNDED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PaymentMethod {
  type: 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CONCORDIUM' | 'ESCROW';
  provider?: string; // Stripe, PayPal, M-Pesa, etc.
  details: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: 'LABEL_CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  estimatedDelivery: Date;
  updates: TrackingUpdate[];
}

export interface TrackingUpdate {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export interface Dispute {
  id: string;
  order: Order;
  initiator: 'BUYER' | 'SELLER';
  reason: DisputeReason;
  description: string;
  evidence: DisputeEvidence[];
  status: DisputeStatus;
  daoVoting?: DAOVoting;
  resolution?: DisputeResolution;
  createdAt: Date;
  updatedAt: Date;
}

export type DisputeReason = 
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'DAMAGED_ITEM'
  | 'WRONG_ITEM'
  | 'LATE_DELIVERY'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

export interface DisputeEvidence {
  type: 'IMAGE' | 'DOCUMENT' | 'MESSAGE' | 'TRANSACTION';
  url: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export type DisputeStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'VOTING'
  | 'RESOLVED'
  | 'APPEALED'
  | 'CLOSED';

export interface DAOVoting {
  jurors: string[]; // User IDs
  votes: DAOVote[];
  deadline: Date;
  quorumRequired: number;
  result?: 'BUYER_WINS' | 'SELLER_WINS' | 'PARTIAL_REFUND';
  executed: boolean;
}

export interface DAOVote {
  juror: string;
  decision: 'BUYER' | 'SELLER' | 'PARTIAL';
  reasoning: string;
  votedAt: Date;
}

export interface DisputeResolution {
  decision: 'BUYER_WINS' | 'SELLER_WINS' | 'PARTIAL_REFUND';
  refundAmount?: number;
  reasoning: string;
  executedAt: Date;
  smartContractTx?: string;
}

export interface ReputationToken {
  id: string;
  owner: string;
  score: number;
  transactions: ReputationTransaction[];
  lastUpdated: Date;
  isActive: boolean;
}

export interface ReputationTransaction {
  id: string;
  orderId: string;
  type: 'PURCHASE' | 'SALE' | 'DISPUTE_WIN' | 'DISPUTE_LOSS' | 'VERIFICATION';
  scoreChange: number;
  timestamp: Date;
  description: string;
}

// Search and Filtering Types
export interface ProductFilter {
  category?: string[];
  priceRange?: [number, number];
  condition?: ('NEW' | 'USED' | 'REFURBISHED')[];
  hasAgeRestriction?: boolean;
  escrowOnly?: boolean;
  freeShipping?: boolean;
  sellerReputationMin?: number;
  inStock?: boolean;
  location?: string;
}

export interface SearchParams {
  query?: string;
  filters?: ProductFilter;
  sortBy?: 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'NEWEST' | 'RATING' | 'DISTANCE';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  conditions: { condition: string; count: number }[];
  locations: { location: string; count: number }[];
}

// Concordium Integration Types
export interface ConcordiumWallet {
  address: string;
  balance: number;
  isConnected: boolean;
  network: 'MAINNET' | 'TESTNET';
}

export interface IdentityVerification {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  level: 'BASIC' | 'ADVANCED' | 'PREMIUM';
  attributes: VerifiedAttribute[];
  verifiedAt?: Date;
  expiresAt?: Date;
}

export interface VerifiedAttribute {
  name: string;
  value: any;
  isZKProof: boolean;
  verifiedAt: Date;
}

export interface SmartContract {
  address: string;
  type: 'ESCROW' | 'REPUTATION' | 'DISPUTE' | 'IDENTITY';
  abi: any;
  deployedAt: Date;
  version: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Analytics Types
export interface SellerAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  reputationScore: number;
  disputeRate: number;
  topProducts: Product[];
  salesByMonth: { month: string; sales: number; revenue: number }[];
  customerSatisfaction: number;
}

export interface PlatformMetrics {
  totalUsers: number;
  verifiedUsers: number;
  totalTransactions: number;
  totalGMV: number; // Gross Merchandise Value
  activeDisputes: number;
  averageResolutionTime: number;
  fraudPrevented: number;
}