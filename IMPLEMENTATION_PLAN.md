# Sanjeevni Implementation Plan

## Project Overview
Decentralized Healthcare Platform with blockchain-based medical records, insurance, and tokenomics.

---

## Phase 1: Core Infrastructure

### 1.1 Smart Contracts

| Contract | Purpose | Status |
|----------|---------|--------|
| `Patient.sol` | Medical records as NFTs | ✅ Complete |
| `Doctor.sol` | Doctor registration & access | ✅ Complete |
| `Hospital.sol` | Hospital management | ✅ Complete |
| `Insurance.sol` | (UUPS) Insurance policies | ✅ Complete |
| `PatientDetails.sol` | (UUPS) Vitals storage | ✅ Complete |
| `Marketplace.sol` | Data marketplace | ✅ Complete |
| `MultiSigWallet.sol` | Multi-sig for organizations | ✅ Complete |
| `SanjeevniToken.sol` | ERC-20 token (SANJ) | ✅ Complete |
| `TokenVesting.sol` | Team vesting | ✅ Complete |
| `SanjeevniICO.sol` | Token sale | ✅ Complete |
| `MetaTransactionHelper.sol` | Gasless transactions | ✅ Complete |
| `InsurancePriceOracle.sol` | Chainlink integration | ✅ Complete |

### 1.2 Libraries & Helpers

| File | Purpose |
|------|---------|
| `libraries/StringUtils.sol` | String utilities |
| `common/SanityChecks.sol` | Reusable error checks |
| `common/SanjeevniAuth.sol` | RBAC base |
| `common/RoleManager.sol` | Role management |
| `common/SanjeevniBase.sol` | Pausable + Emergency |
| `interfaces/IInsurance.sol` | Contract interfaces |

---

## Phase 2: Backend Services

### 2.1 Services

```javascript
// server/services/
├── metaTransactionService.js  // Gasless tx relayer
├── custodianWalletService.js   // Managed wallets
├── insuranceClaimService.js   // Claims processing
├── notificationService.js   // Push notifications
├── messagingService.js     // Real-time messaging
├── pdfService.js           // Document generation
└── logger.js             // Winston logging
```

### 2.2 Key Features
- Winston structured logging
- Rate limiting (multiple tiers)
- Custodian wallet (non-crypto users)
- WebSocket real-time updates

---

## Phase 3: Frontend

### 3.1 Pages

| Route | Page |
|-------|------|
| `/` | Landing + Login |
| `/patient/dashboard/*` | Patient dashboard |
| `/doctor/dashboard/*` | Doctor dashboard |
| `/insurance/dashboard/*` | Insurance dashboard |
| `/hospital/dashboard/*` | Hospital dashboard |
| `/company/dashboard/*` | Company marketplace |
| `/explorer` | Blockchain explorer |
| `/token` | Token management |
| `/api-docs` | API documentation |

### 3.2 Contexts & Hooks

```javascript
// context/
├── Web3Context.js       // MetaMask + Firebase auth

// hooks/
├── useToken.js         // Token (transfer, burn, vesting)
├── useOracle.js        // Chainlink price feeds
├── useMetaTransaction.js // Gasless transactions
└── lib/use-mobile.tsx
```

---

## Phase 4: Blockchain Explorer (The Graph)

### 4.1 Subgraph Entities

```graphql
type Patient
type Doctor
type InsuranceProvider
type Policy
type Claim
type AccessGrant
type Transaction
type ContractDeployment
```

### 4.2 Usage

```bash
# Deploy subgraph
graph create sanjeevni --node https://api.thegraph.com/deploy/
graph deploy sanjeevni/subgraph --ipfs ... --node ...

# Query
const query = `query { patients(first: 10) { id wallet name } }`;
```

---

## Phase 5: Tokenomics

### 5.1 Token Distribution

| Allocation | % | Amount |
|------------|---|--------|
| Community/ICO | 40% | 40M |
| Team | 20% | 20M |
| Staking Rewards | 20% | 20M |
| Ecosystem | 10% | 10M |
| Marketing | 10% | 10M |

### 5.2 Token Utility

- Insurance premium payments
- Data marketplace purchases
- Doctor consultation fees
- Governance voting
- Staking rewards

---

## Phase 6: Features Checklist

### Smart Contracts
- [x] ERC-721 medical records
- [x] Doctor/patient access control
- [x] Insurance with ZK-proofs
- [x] UUPS upgradeable contracts
- [x] Multi-sig wallet
- [x] Gasless meta-transactions
- [x] Chainlink oracle integration
- [x] Frontend helpers (dashboard, pagination, filters)
- [x] Batch operations
- [x] Access expiry cleanup
- [x] Pausable contracts
- [x] Role-based access

### Security
- [x] Slither static analysis
- [x] Echidna fuzz testing
- [x] NatSpec documentation
- [x] Reentrancy guards
- [x] Zero-address validation
- [x] Access control

### Developer Experience
- [x] API documentation
- [x] Blockchain explorer UI
- [x] Token management UI
- [x] WalletConnect integration

---

## Deployment Sequence

### 1. Deploy Contracts (Development)
```bash
cd contracts
npm run dev:ganache &
npm run dev:deploy
```

### 2. Deploy Subgraph
```bash
cd subgraph
graph create sanjeevni
graph deploy sanjeevni/subgraph
```

### 3. Start Backend
```bash
cd server
npm run dev
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

### 5. Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_VESTING_ADDRESS=0x...
NEXT_PUBLIC_ICO_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_INSURANCE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_GRAPH_API=http://localhost:8000/subgraphs/name/sanjeevni

# Backend (.env)
DATABASE_URL=postgresql://...
RPC_URL=http://localhost:8545
RELAYER_PRIVATE_KEY=0x...
```

---

## Smart Contract Addresses (Localhost)

| Contract | Address |
|----------|---------|
| Patient | 0x0000000000000000000000000000000000000001 |
| Doctor | 0x0000000000000000000000000000000000000002 |
| Hospital | 0x0000000000000000000000000000000000000003 |
| Insurance | 0x0000000000000000000000000000000000000004 |
| PatientDetails | 0x0000000000000000000000000000000000000005 |
| Marketplace | 0x0000000000000000000000000000000000000006 |
| SanjeevniToken | 0x0000000000000000000000000000000000000007 |
| TokenVesting | 0x0000000000000000000000000000000000000008 |
| SanjeevniICO | 0x0000000000000000000000000000000000000009 |
| MetaTransactionHelper | 0x000000000000000000000000000000000000000A |
| InsurancePriceOracle | 0x000000000000000000000000000000000000000B |

---

## Summary of Code Structure

```
Sanjeevni/
├── contracts/
│   ├── contracts/
│   │   ├── common/           # Shared contracts
│   │   ├── helpers/          # Dashboard helpers
│   │   ├── interfaces/     # Contract interfaces
│   │   ├── libraries/       # Utility libraries
│   │   ├── Patient.sol
│   │   ├── Doctor.sol
│   │   ├── Insurance.sol
│   │   ├── SanjeevniToken.sol
│   │   └── ...
│   ├── migrations/
│   ├── test/
│   ├── build/
│   └── package.json
│
├── subgraph/
│   ├── schema.graphql
│   ├── subgraph.yaml
│   ├── src/
│   └── abis/
│
├── server/
│   ├── index.js
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── prisma/
│
└── frontend/
    ├── app/
    │   ├── page.jsx
    │   ├── explorer/
    │   ├── token/
    │   └── api-docs/
    ├── components/
    ├── context/
    │   └── Web3Context.js
    ├── hooks/
    │   ├── useToken.js
    │   ├── useOracle.js
    │   └── useMetaTransaction.js
    └── package.json
```

---

## Next Steps

1. **Testnet Deployment** - Deploy contracts to Sepolia/Holesky
2. **Frontend Configuration** - Set contract addresses in environment
3. **Subgraph Deployment** - Deploy The Graph indexer
4. **Token Sale** - Launch ICO
5. **Staking** - Implement staking rewards
6. **Mobile App** - React Native wrapper

---

*Generated: 2026-04-09*
*Version: 1.0.0*