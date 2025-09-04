import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  businessName: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  businessAddress?: string;
  concordiumAddress?: string;
  avalancheAddress?: string;
  status: "pending" | "active" | "suspended";
  registrationDate: Date;
  onboardedBy?: string;
}

const VendorSchema = new Schema<IVendor>(
  {
    businessName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    website: { type: String },
    businessAddress: { type: String },
    concordiumAddress: { type: String },
    avalancheAddress: { type: String },
    status: { type: String, enum: ["pending", "active", "suspended"], default: "active" },
    registrationDate: { type: Date, default: Date.now },
    onboardedBy: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);
