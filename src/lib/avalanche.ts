import { ethers } from "ethers";

export const AVALANCHE = {
  chainId: 43114,
  rpcUrl: import.meta.env.VITE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
  usdt: import.meta.env.VITE_USDT,
  escrow: import.meta.env.VITE_ESCROW,
  vendorPass: import.meta.env.VITE_VENDORPASS
};

export const ESCROW_ABI = [
  "function computeId(string orderRef) view returns (bytes32)",
  "function createOrder(address vendor,uint256 amount,string orderRef)",
  "function release(bytes32 oid)",
  "event OrderCreated(bytes32 indexed orderId,address indexed buyer,address indexed vendor,uint256 amount)",
  "event Released(bytes32 indexed orderId,address indexed vendor,uint256 amount,uint256 fee)",
  "event Refunded(bytes32 indexed orderId,address indexed buyer,uint256 amount)"
];

export const VENDORPASS_ABI = [
  "function isVendor(address) view returns (bool)"
];

export const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)"
];

export function getProvider() {
  const anyWindow = window as any;
  if (anyWindow.ethereum) return new ethers.BrowserProvider(anyWindow.ethereum, "any");
  return new ethers.JsonRpcProvider(AVALANCHE.rpcUrl, AVALANCHE.chainId);
}

export async function getSigner() {
  const provider = getProvider();
  const signer = await provider.getSigner();
  return signer;
}

export async function isVendor(addr: string): Promise<boolean> {
  if (!AVALANCHE.vendorPass) return false;
  const provider = getProvider();
  const vp = new ethers.Contract(AVALANCHE.vendorPass, VENDORPASS_ABI, provider);
  return vp.isVendor(addr);
}

export async function approveUsdtIfNeeded(owner: string, amount: bigint) {
  if (!AVALANCHE.usdt || !AVALANCHE.escrow) throw new Error("Missing USDT/ESCROW env");
  const signer = await getSigner();
  const erc20 = new ethers.Contract(AVALANCHE.usdt, ERC20_ABI, signer);
  const allowance: bigint = await erc20.allowance(owner, AVALANCHE.escrow);
  if (allowance < amount) {
    await (await erc20.approve(AVALANCHE.escrow, amount)).wait();
  }
}

export async function createEscrowOrder(vendor: string, usdAmount: number, orderRef: string) {
  if (!AVALANCHE.escrow || !AVALANCHE.usdt) throw new Error("Missing env");
  const signer = await getSigner();
  const addr = await signer.getAddress();
  const amount: bigint = BigInt(Math.round(usdAmount * 1_000_000)); // USDT 6 decimals
  await approveUsdtIfNeeded(addr, amount);
  const escrow = new ethers.Contract(AVALANCHE.escrow, ESCROW_ABI, signer);
  const tx = await escrow.createOrder(vendor, amount, orderRef);
  return tx.wait();
}

export async function releaseEscrow(orderRef: string) {
  if (!AVALANCHE.escrow) throw new Error("Missing env");
  const signer = await getSigner();
  const escrow = new ethers.Contract(AVALANCHE.escrow, ESCROW_ABI, signer);
  const oid: string = await escrow.computeId(orderRef);
  const tx = await escrow.release(oid);
  return tx.wait();
}
