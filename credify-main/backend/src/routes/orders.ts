import { Router } from "express";
import Order from "../models/Order";
import Product from "../models/Product";

const router = Router();

router.post("/", async (req, res) => {
  const { customer, payment, items, walletAddress } = req.body as any;
  const ids = items.map((i: any) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const orderItems = items.map((i: any) => {
    const p = products.find((pp: any) => pp._id.toString() === i.productId);
    return { product: p?._id, title: p?.title || i.title, price: p?.price || i.price, quantity: i.quantity };
  });
  const subtotal = orderItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const escrowFee = items.some((i: any) => i.escrowRequired) ? subtotal * 0.02 : 0;
  const total = subtotal + escrowFee;
  const order = await Order.create({ customer, payment: { ...payment, amount: total, currency: "USD", status: "verified" }, items: orderItems, subtotal, escrowFee, total, walletAddress, status: "completed" });
  res.status(201).json({ orderId: order._id.toString() });
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json({ order });
});

router.get("/", async (req, res) => {
  const { email, wallet } = req.query as any;
  const filter: any = {};
  if (email) filter["customer.email"] = email;
  if (wallet) filter.walletAddress = wallet;
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ orders });
});

export default router;
