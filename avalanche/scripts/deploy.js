const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const feeBps = Number(process.env.FEE_BPS || 200); // 2%
  const USDC = process.env.USDC || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // Avalanche USDC

  const VendorPass = await ethers.getContractFactory("VendorPass");
  const vendorPass = await VendorPass.deploy(owner);
  await vendorPass.waitForDeployment();
  console.log("VendorPass:", await vendorPass.getAddress());

  const Escrow = await ethers.getContractFactory("EscrowUSDC");
  const escrow = await Escrow.deploy(USDC, await vendorPass.getAddress(), feeRecipient, feeBps, owner);
  await escrow.waitForDeployment();
  console.log("EscrowUSDC:", await escrow.getAddress());

  console.log("Export env:");
  console.log("VITE_VENDORPASS=", await vendorPass.getAddress());
  console.log("VITE_ESCROW=", await escrow.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
