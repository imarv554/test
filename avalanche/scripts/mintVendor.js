const { ethers } = require("hardhat");
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });

async function main() {
  const vendorPassAddress = process.env.VENDORPASS;
  const to = process.env.MINT_TO || process.argv[2];
  const uri = process.env.MINT_URI || "";
  if (!vendorPassAddress) throw new Error("VENDORPASS address missing in avalanche/.env");
  if (!to) throw new Error("Provide vendor wallet: MINT_TO or argv[2]");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  const vp = await ethers.getContractAt("VendorPass", vendorPassAddress);
  const tx = await vp.mint(to, uri);
  const r = await tx.wait();
  const transfer = r.logs.find(l => l.fragment && l.fragment.name === 'Transfer');
  const tokenId = transfer ? transfer.args[2].toString() : 'unknown';
  console.log(`Minted VendorPass tokenId=${tokenId} to ${to}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
