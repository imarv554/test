import { Router } from "express";
import Product from "../models/Product";

const router = Router();

router.get("/", async (req, res) => {
  const q = (req.query.q as string) || "";
  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } }
        ]
      }
    : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products });
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ product });
});

router.post("/", async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

router.put("/:id", async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ product });
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

export default router;
