# MIGRATION TO VERCEL (from fork on Netlify)

This document explains how to move this fork (currently deployed on Netlify) into the upstream repository hosted on Vercel, and what to configure in Vercel so Avalanche USDT escrow works exactly the same after merge.

## TL;DR
- Keep the code as-is; this repo already includes `vercel.json` (SPA rewrites to index.html). Use Node 20 and `npm install --legacy-peer-deps && npm run build` on Vercel.
- Set Vercel env vars: `VITE_RPC_URL`, `VITE_USDT`, `VITE_VENDORPASS`, `VITE_ESCROW`, plus any keys like `VITE_PAYSTACK_PUBLIC_KEY`.
- Remove large Git LFS ZIPs from the upstream PR to avoid slow/cloned assets in Vercel.
- We do not deploy Hardhat or the backend to Vercel—only the static SPA.

---

## Current state (this fork)
- Frontend: Vite + React + TypeScript (SPA) deployed to Netlify
- Blockchain: Avalanche C‑Chain (mainnet), payments via USDT, vendor identity via non‑transferable VendorPass NFT, Escrow contract for orders
- Env vars used in frontend:
  - `VITE_RPC_URL` (Avalanche RPC)
  - `VITE_USDT` (USDT token address on Avalanche)
  - `VITE_VENDORPASS` (deployed VendorPass address)
  - `VITE_ESCROW` (deployed Escrow address)
  - `VITE_PAYSTACK_PUBLIC_KEY` (optional for card payments)
- Build command (Netlify): `npm install --legacy-peer-deps --no-fund --no-audit && npm run build`
- Output: `dist/`
- SPA routing: `_redirects` file in `public/` handles history fallback

## What changes on Vercel
- Vercel needs a SPA history fallback (all routes → `index.html`). Do this with `vercel.json` rewrites (see below).
- Specify Node 20 runtime and the same install/build command to avoid peer dependency issues.
- Set the same Vite env vars in Vercel Project Settings → Environment Variables.
- Vercel does not download Git LFS objects by default. Avoid committing large ZIPs tracked by LFS into the upstream repo.
- Only the frontend SPA is deployed. Hardhat (under `avalanche/`) is for local deployment of contracts. The Express backend (if any) is not deployed to Vercel unless intentionally adapted to Vercel Functions (not required here).

## Step‑by‑step migration

### 1) Prepare a PR from fork → upstream
- Ensure the following are present/updated in the fork before opening the upstream PR:
  - `package.json` contains standard build scripts:
    - `build`: `vite build`
  - `public/_redirects` exists (Netlify), but we will add Vercel rewrites too.
  - Remove any large LFS assets not needed for the build (e.g., `credify-backend-integration.zip`). If they must exist, keep them in a separate storage (Drive/S3) and link to them.
  - Add `vercel.json` (see example below). This file is safe to land in both Netlify and Vercel; Netlify ignores it.

### 2) Create `vercel.json` in the upstream repo (recommended)
Minimal SPA rewrite config:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

If you prefer explicit static build detection in older Vercel setups:

```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "@vercel/static-build" }],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

Either approach works; the first is simpler for modern Vercel.

### 3) Configure the Vercel Project
- Import the upstream repo into Vercel (or point Vercel to the same GitHub repo if it already exists).
- Framework Preset: Vite (or Other → it will still work)
- Node version: 20.x
- Install Command: `npm install --legacy-peer-deps --no-fund --no-audit`
- Build Command: `npm run build`
- Output Directory: `dist`

### 4) Set Vercel Environment Variables
Vercel → Project → Settings → Environment Variables (set for Production and Preview as needed):

- `VITE_RPC_URL` → `https://api.avax.network/ext/bc/C/rpc`
- `VITE_USDT` → `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`
- `VITE_VENDORPASS` → `<your deployed VendorPass address>`
- `VITE_ESCROW` → `<your deployed Escrow address>`
- `VITE_PAYSTACK_PUBLIC_KEY` → `<your key>` (if using Paystack)

Notes:
- Do not set any private keys in Vercel; contract deployment is done locally via Hardhat.
- After saving env vars, trigger a Production redeploy in Vercel.

### 5) Contracts deployment (local only, not on Vercel)
- In your terminal:
  1. `cd avalanche`
  2. `cp .env.example .env` and fill:
     - `AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc`
     - `DEPLOYER_KEY=<your EOA private key funded with small AVAX>`
     - `OWNER_ADDRESS=0x086ad0D712e0Ad0A61032372C344190972B5e4d8`
     - `FEE_RECIPIENT=0x65b7a307a7e67e38840b91f9a36bf8dfe6e02901`
     - `FEE_BPS=500`
     - `USDT=0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`
  3. `npm install`
  4. `npx hardhat run scripts/deploy.js --network avalanche`
- The script will print:
  - `VITE_VENDORPASS=0x...`
  - `VITE_ESCROW=0x...`
- Copy those to Vercel env. You can also add a small script to save these to `avalanche/deployments/mainnet.json` for documentation.

### 6) Post‑merge checks on Vercel
- Visit the deployed site on Vercel (Production):
  - Check navigation, `/vendor-login`, and `/credify-admin-secure` (secret path, not linked)
  - Add one product with a `vendorWallet` set
  - Ensure the vendor wallet holds a VendorPass (mint via the provided script)
  - Do a tiny canary purchase (e.g., 1 USDT), approve + deposit to Escrow, then “Release Escrow”

### 7) Git LFS note
- Vercel’s build clones typically do not fetch LFS objects. If the upstream repo contains a large LFS‑tracked ZIP, builds may lack that file.
- Recommendation: remove large ZIPs from the upstream PR (or keep them in external storage) to keep Vercel builds fast and reliable.

### 8) Rollback plan
- If the Vercel deploy fails after merge: revert the upstream PR (or switch Vercel’s Production deployment to the last known good build) and fix issues in a new PR.

### 9) Security & ownership
- Contract ownership (`OWNER_ADDRESS`) should be a Gnosis Safe on Avalanche; do not store private keys in the repo or Vercel.
- `DEPLOYER_KEY` is only for local Hardhat deploys; never add it to Vercel envs.

### 10) Troubleshooting
- Build fails on Vercel:
  - Ensure Node 20, and use `npm install --legacy-peer-deps --no-fund --no-audit`
  - Check peer dependency conflicts in logs
- SPA routes 404:
  - Ensure `vercel.json` rewrites exist (all routes → `/index.html`)
- On‑chain calls fail:
  - Verify `VITE_*` env addresses are correct and on Avalanche mainnet
  - Confirm MetaMask is connected to chainId 43114
- USDT decimals:
  - We use 6 decimals; amounts are multiplied by 1,000,000 before approval/deposit

---

## Appendix A — Example `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Appendix B — Env var checklist (Vercel)
```
VITE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
VITE_USDT=0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7
VITE_VENDORPASS=0x...
VITE_ESCROW=0x...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

## Appendix C — Build settings (Vercel)
- Node.js Version: 20.x
- Install Command: `npm install --legacy-peer-deps --no-fund --no-audit`
- Build Command: `npm run build`
- Output Directory: `dist`

## Appendix D — What we intentionally do NOT move to Vercel
- Hardhat project and deployment keys (local/dev only)
- Express backend under `/backend` (unless later adapted to Vercel Functions)
- Large LFS assets

---

When you’re ready to migrate, open the upstream PR including `vercel.json`, remove any LFS ZIPs, and follow the Vercel setup above. This yields a 1:1 experience with the current Netlify deployment.
