# CREDIFY Smart Contracts

This directory contains the Rust smart contracts for the CREDIFY identity-first e-commerce platform, designed to run on the Concordium blockchain mainnet.

## Overview

The CREDIFY platform uses three interconnected smart contracts to enable secure, trustless e-commerce:

### 1. Escrow Contract (`credify_escrow`)
Handles secure transactions between buyers and sellers with automated escrow functionality.

**Key Features:**
- ✅ Automated escrow with smart contract logic
- ✅ Identity verification requirements
- ✅ Multi-stage transaction lifecycle
- ✅ Dispute resolution integration  
- ✅ Platform fee collection
- ✅ Refund mechanisms

**Contract Functions:**
- `createEscrow` - Create new escrow transaction
- `confirmIdentity` - Verify buyer/seller identity
- `activateEscrow` - Activate when conditions met
- `confirmDelivery` - Seller confirms delivery
- `completeTransaction` - Buyer completes purchase
- `raiseDispute` - Initiate dispute process

### 2. Reputation Contract (`credify_reputation`)
Implements a non-transferable reputation token system using CIS-2 standard.

**Key Features:**
- ✅ Non-transferable reputation tokens
- ✅ Weighted scoring system based on transaction history
- ✅ Identity verification level bonuses
- ✅ Dispute outcome integration
- ✅ Reputation decay for inactive accounts
- ✅ CIS-2 compliant token standard

**Reputation Factors:**
- Successful transactions (buyer/seller)
- Transaction values
- Identity verification level
- Dispute outcomes
- Account age and activity
- Community participation

### 3. Dispute Resolution Contract (`credify_dispute`)
DAO-based dispute resolution system with community voting.

**Key Features:**
- ✅ Community-driven dispute resolution
- ✅ Weighted voting based on reputation
- ✅ Time-bounded voting periods
- ✅ Automatic resolution execution
- ✅ Evidence submission system
- ✅ Anti-gaming mechanisms

**Voting System:**
- Reputation-weighted votes
- Quorum requirements  
- Multiple resolution options (buyer, seller, split)
- Incentives for participation
- Protection against vote manipulation

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Escrow        │    │   Reputation    │    │   Dispute       │
│   Contract      │◄──►│   Contract      │◄──►│   Resolution    │
│                 │    │                 │    │   Contract      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │   CREDIFY       │
                        │   Frontend      │
                        │   (React/TS)    │
                        └─────────────────┘
```

## Contract Interactions

1. **Escrow ↔ Reputation**: Updates reputation scores after transactions and disputes
2. **Escrow ↔ Dispute**: Creates disputes and executes resolutions
3. **Reputation ↔ Dispute**: Provides voting weights based on reputation
4. **Frontend ↔ All Contracts**: User interactions and state queries

## Building Contracts

### Prerequisites
- Rust (latest stable)
- Concordium Rust SDK
- `concordium-client` CLI tool

### Build Commands

```bash
# Install dependencies
cargo install --locked concordium-smart-contract-tools

# Build all contracts
./build.sh

# Or build individually
cargo concordium build --out contracts
```

This generates:
- `contracts/credify_escrow.wasm.v1`
- `contracts/credify_reputation.wasm.v1` 
- `contracts/credify_dispute.wasm.v1`

## Deployment

### Mainnet Deployment

1. **Deploy Reputation Contract First:**
```bash
concordium-client module deploy credify_reputation.wasm.v1 \
  --sender YOUR_ACCOUNT \
  --name credify_reputation
```

2. **Deploy Escrow Contract:**
```bash
concordium-client module deploy credify_escrow.wasm.v1 \
  --sender YOUR_ACCOUNT \
  --name credify_escrow
```

3. **Deploy Dispute Resolution Contract:**
```bash
concordium-client module deploy credify_dispute.wasm.v1 \
  --sender YOUR_ACCOUNT \
  --name credify_dispute
```

4. **Initialize Contracts:**
```bash
# Initialize reputation contract
concordium-client contract init credify_reputation \
  --sender YOUR_ACCOUNT \
  --energy 5000 \
  --parameter-json '{"admin": "YOUR_ACCOUNT", "base_reputation": 100}'

# Initialize escrow contract  
concordium-client contract init credify_escrow \
  --sender YOUR_ACCOUNT \
  --energy 5000 \
  --parameter-json '{"admin": "YOUR_ACCOUNT", "platform_fee": 200}'

# Initialize dispute contract
concordium-client contract init credify_dispute \
  --sender YOUR_ACCOUNT \
  --energy 5000 \
  --parameter-json '{
    "admin": "YOUR_ACCOUNT",
    "min_reputation_to_vote": 100,
    "voting_period_hours": 168,
    "min_votes_required": 3,
    "quorum_percentage": 51
  }'
```

### Contract Addresses

After deployment, update the frontend configuration with the contract addresses:

```typescript
// src/config/contracts.ts
export const MAINNET_CONTRACTS = {
  escrow: "CONTRACT_ADDRESS_1",
  reputation: "CONTRACT_ADDRESS_2", 
  dispute: "CONTRACT_ADDRESS_3"
};
```

## Integration with Frontend

The contracts integrate with the CREDIFY frontend through:

1. **Concordium Web SDK**: Direct contract calls
2. **Event Listening**: Real-time transaction updates
3. **State Queries**: Reading contract state
4. **Wallet Integration**: Transaction signing

### Example Usage

```typescript
// Create escrow transaction
const result = await wallet.invokeContract({
  amount: CcdAmount.fromCcd(100),
  contractAddress: ESCROW_CONTRACT,
  receiveName: "credify_escrow.createEscrow",
  parameter: {
    seller: sellerAccount,
    description: "Premium wireless headphones",
    requires_identity_verification: true
  }
});
```

## Security Considerations

### Access Control
- Admin functions are restricted to designated accounts
- Cross-contract calls are authenticated
- Identity verification is enforced where required

### Economic Security
- Platform fees prevent spam
- Reputation staking discourages bad behavior
- Dispute resolution incentivizes honest participation

### Smart Contract Security
- Input validation on all parameters
- Overflow protection in calculations
- State consistency checks
- Proper error handling

## Testing

```bash
# Run contract tests
cargo test

# Run integration tests
cargo test --test integration_tests
```

## Gas Costs (Estimated)

| Operation | Energy Cost | CCD Cost (approx) |
|-----------|-------------|-------------------|
| Create Escrow | 2,500 | ~0.0025 CCD |
| Complete Transaction | 3,000 | ~0.003 CCD |
| Cast Vote | 2,000 | ~0.002 CCD |
| Update Reputation | 1,500 | ~0.0015 CCD |

## Mainnet Configuration

The contracts are configured for Concordium mainnet deployment with:

- **Network**: Concordium Mainnet
- **Genesis Hash**: `4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796`
- **Your Wallet**: `3SwtbfyHrT68giUKV6FzDAxBBPo9xbsLgjG34U3UXfJrNJFxbL`

## Support

For technical support:
- Review Concordium documentation: https://docs.concordium.com
- Check contract events and logs for debugging
- Verify transaction status on Concordium explorer

## License

Smart contracts are licensed under MIT License. See LICENSE file for details.