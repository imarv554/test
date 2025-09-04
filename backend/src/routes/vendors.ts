import { Router } from "express";
import Vendor from "../models/Vendor";
import { sendVendorOnboardEmail } from "../services/email";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, website, businessAddress, concordiumAddress, avalancheAddress, onboardedBy } = req.body || {};
    if (!businessName || !ownerName || !email) return res.status(400).json({ error: "Missing required fields" });

    const existing = await Vendor.findOne({ email });
    if (existing) {
      return res.status(200).json({ vendor: existing, message: "Vendor already exists" });
    }

    const vendor = await Vendor.create({
      businessName,
      name: ownerName,
      email,
      phone,
      website,
      businessAddress,
      concordiumAddress,
      avalancheAddress,
      status: "active",
      onboardedBy: onboardedBy || "self",
    });

    try {
      await sendVendorOnboardEmail(email, ownerName, businessName);
    } catch (e) {
      // Don't fail the API if email fails; report warning
      console.error("Email error:", e);
    }

    return res.status(201).json({ vendor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/onboard", async (req, res) => {
  // Admin-triggered onboarding
  try {
    const { businessName, name, email, concordiumAddress, phone } = req.body || {};
    if (!businessName || !name || !email) return res.status(400).json({ error: "Missing required fields" });

    const vendor = await Vendor.findOneAndUpdate(
      { email },
      { businessName, name, email, concordiumAddress, phone, status: "active", onboardedBy: "admin" },
      { upsert: true, new: true }
    );

    try {
      await sendVendorOnboardEmail(email, name, businessName);
    } catch (e) {
      console.error("Email error:", e);
    }

    return res.json({ vendor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    // Demo session token (not secure). In real app, issue JWT and set httpOnly cookie.
    const session = Buffer.from(`${vendor._id}:${Date.now()}`).toString("base64");
    return res.json({ ok: true, vendor: { id: vendor._id, businessName: vendor.businessName, name: vendor.name, email: vendor.email }, session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
