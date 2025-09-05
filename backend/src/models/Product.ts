import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  currency: "USD" | "EUR" | "CCD";
  images: string[];
  vendorWallet?: string;
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
  condition: "NEW" | "USED" | "REFURBISHED";
  shipping: {
    free: boolean;
    cost?: number;
    estimatedDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, enum: ["USD", "EUR", "CCD"], default: "USD" },
    images: { type: [String], default: [] },
    vendorWallet: { type: String, required: false },
    category: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      requiresVerification: { type: Boolean, default: false }
    },
    seller: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      reputationScore: { type: Number, default: 0 },
      isVerified: { type: Boolean, default: false }
    },
    ageRestriction: {
      minimumAge: { type: Number, enum: [18, 21], required: false },
      requiresZKProof: { type: Boolean, required: false }
    },
    escrowRequired: { type: Boolean, default: false },
    inventory: { type: Number, default: 0 },
    condition: { type: String, enum: ["NEW", "USED", "REFURBISHED"], default: "NEW" },
    shipping: {
      free: { type: Boolean, default: true },
      cost: { type: Number, required: false },
      estimatedDays: { type: Number, default: 3 }
    }
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
