import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import healthRouter from "./routes/health";
import verifyRouter from "./routes/verify";
import vendorsRouter from "./routes/vendors";
import Product from "./models/Product";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/verify-payment", verifyRouter);
app.use("/api/vendors", vendorsRouter);

const PORT = Number(process.env.PORT || 4000);

async function seed() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany([
    {
      title: "Premium Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation and premium sound quality",
      price: 299.99,
      currency: "USD",
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
      category: { id: "electronics", name: "Electronics", requiresVerification: false },
      seller: { id: "seller1", name: "TechStore Pro", reputationScore: 95, isVerified: true },
      escrowRequired: true,
      inventory: 15,
      condition: "NEW",
      shipping: { free: true, estimatedDays: 3 }
    },
    {
      title: "Vintage Whiskey Collection",
      description: "Rare vintage whiskey bottles for collectors - aged 25 years",
      price: 500,
      currency: "USD",
      images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop"],
      category: { id: "alcohol", name: "Alcoholic Beverages", requiresVerification: true },
      seller: { id: "seller2", name: "Premium Spirits", reputationScore: 88, isVerified: true },
      ageRestriction: { minimumAge: 21, requiresZKProof: true },
      escrowRequired: true,
      inventory: 5,
      condition: "NEW",
      shipping: { free: false, cost: 25, estimatedDays: 5 }
    },
    {
      title: "Smart Watch Pro",
      description: "Latest smartwatch with health monitoring, GPS, and 7-day battery life",
      price: 449.99,
      currency: "USD",
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
      category: { id: "electronics", name: "Electronics", requiresVerification: false },
      seller: { id: "seller3", name: "Digital World", reputationScore: 92, isVerified: true },
      escrowRequired: true,
      inventory: 8,
      condition: "NEW",
      shipping: { free: true, estimatedDays: 2 }
    }
  ]);
}

async function start() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/credify";
  await connectDB(uri);
  await seed();
  app.listen(PORT, () => {});
}

start();
