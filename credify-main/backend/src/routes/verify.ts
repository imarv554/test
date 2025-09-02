import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  const { reference } = req.body as any;
  if (!reference) return res.status(400).json({ verified: false });
  res.json({ verified: true });
});

export default router;
