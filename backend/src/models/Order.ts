import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  payment: {
    method: "card" | "ccd" | "avax";
    reference?: string;
    amount: number;
    currency: string;
    status: "verified" | "pending" | "failed";
  };
  items: IOrderItem[];
  subtotal: number;
  escrowFee: number;
  total: number;
  walletAddress?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const OrderSchema = new Schema<IOrder>(
  {
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },
    payment: {
      method: { type: String, enum: ["card", "ccd", "avax"], required: true },
      reference: { type: String },
      amount: { type: Number, required: true },
      currency: { type: String, default: "USD" },
      status: { type: String, enum: ["verified", "pending", "failed"], default: "verified" }
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    escrowFee: { type: Number, required: true },
    total: { type: Number, required: true },
    walletAddress: { type: String },
    status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"], default: "completed" }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
