#!/bin/bash
set -e

echo "Building CREDIFY Smart Contracts for Concordium..."

# Build the contracts
cargo concordium build --out contracts

echo "✅ CREDIFY smart contracts built successfully!"
echo ""
echo "Generated contract files:"
echo "- contracts/escrow.wasm.v1"  
echo "- contracts/reputation.wasm.v1"
echo "- contracts/dispute_resolution.wasm.v1"
echo ""
echo "Deploy these contracts to Concordium mainnet using:"
echo "concordium-client module deploy <contract.wasm.v1> --sender <your-account> --name <contract-name>"
echo ""
echo "Contract deployment addresses will need to be configured in the frontend for mainnet integration."