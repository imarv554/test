const { ethers } = require("hardhat");
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
  console.log("VendorPass:", await vendorPass.getAddress());

  const Escrow = await ethers.getContractFactory("EscrowUSDC");
  const escrow = await Escrow.deploy(USDT, await vendorPass.getAddress(), feeRecipient, feeBps, owner);
  await escrow.waitForDeployment();
  console.log("EscrowUSDC:", await escrow.getAddress());

  console.log("Export env:");
  console.log("VITE_VENDORPASS=", await vendorPass.getAddress());
  console.log("VITE_ESCROW=", await escrow.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
