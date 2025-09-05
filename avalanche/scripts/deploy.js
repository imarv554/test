const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const feeBps = Number(process.env.FEE_BPS || 500); // 5%
  const USDT = process.env.USDT || "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"; // Avalanche USDT

  const VendorPass = await ethers.getContractFactory("VendorPass");
  const vendorPass = await VendorPass.deploy(owner);
  await vendorPass.waitForDeployment();
  const vendorPassAddr = await vendorPass.getAddress();
  console.log("VendorPass:", vendorPassAddr);

  const Escrow = await ethers.getContractFactory("EscrowUSDC");
  const escrow = await Escrow.deploy(USDT, vendorPassAddr, feeRecipient, feeBps, owner);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("EscrowUSDC:", escrowAddr);

  // Save addresses to avalanche/deployments/mainnet.json (or current network)
  const outDir = path.join(__dirname, "..", "deployments");
  const outPath = path.join(outDir, `${network.name}.json`);
  fs.mkdirSync(outDir, { recursive: true });
  const payload = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    vendorPass: vendorPassAddr,
    escrow: escrowAddr,
    token: USDT,
    feeRecipient,
    feeBps,
    owner
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`\nSaved deployment → ${outPath}`);

  // Print .env snippet for frontend
  console.log("\nExport env:");
  console.log(`VITE_VENDORPASS=${vendorPassAddr}`);
  console.log(`VITE_ESCROW=${escrowAddr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
