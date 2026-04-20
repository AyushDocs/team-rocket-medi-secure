# Product Requirements Document (PRD)
## Sanjeevni - Decentralized Healthcare Platform

---

## 1. Project Overview

**Project Name:** Sanjeevni  
**Type:** Decentralized Healthcare DApp  
**Core Functionality:** A blockchain-based medical records management system with patient-owned data, secure doctor access, insurance integration, and ethical data monetization.  
**Target Users:** Patients, Doctors, Hospitals, Insurance Providers, Research Companies

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **State Management:** React Context (Web3Context)
- **Authentication:** Firebase Auth (Google) + MetaMask
- **UI Components:** shadcn/ui

### Backend
- **Framework:** Express.js
- **Database:** Prisma (PostgreSQL)
- **Storage:** IPFS (via Pinata)
- **Real-time:** Socket.io

### Smart Contracts
- **Framework:** Truffle
- **Language:** Solidity ^0.8.20
- **Libraries:** OpenZeppelin Contracts

---

## 3. Implemented Features

### 3.1 Smart Contracts

| Contract | Status | Description |
|----------|--------|-------------|
| Patient.sol | ✅ Complete | ERC721-based medical record NFT management |
| Doctor.sol | ✅ Complete | Doctor registration, patient access management |
| Hospital.sol | ✅ Complete | Hospital registration, doctor duty tracking |
| Insurance.sol | ✅ Complete | Policy management, ZK-proof premium calculation |
| Marketplace.sol | ✅ Complete | Data marketplace for research companies |
| PatientDetails.sol | ✅ Complete | Patient vitals and clinical alerts |
| HandoffManager.sol | ✅ Complete | Clinical handoff management |
| InsuranceVerifier.sol | ✅ Complete | ZK proof verifier for insurance |
| MediSecureAccessControl.sol | ✅ New | Central RBAC with OpenZeppelin |
| RBACDoctor.sol | ✅ New | Doctor with AccessControl roles |

### 3.2 Testing & Security

| Feature | Status | Description |
|---------|--------|-------------|
| Truffle Tests | ✅ Complete | Unit tests for all contracts |
| Slither Analysis | ✅ Complete | Static analysis with security fixes |
| Echidna Fuzz Tests | ✅ New | Property-based fuzz testing |
| NatSpec Docs | ✅ Complete | Full documentation for public functions |

### 3.3 Authentication

| Feature | Status | Description |
|---------|--------|-------------|
| MetaMask Wallet | ✅ Complete | Traditional Web3 wallet login |
| Google Auth | ✅ New | Firebase Google OAuth |
| Custodian Wallet | ✅ New | Managed wallet for non-crypto users |
| Wallet Linking | ✅ New | Link MetaMask to Google account |

### 3.4 Backend Features

| Feature | Status | Description |
|---------|--------|-------------|
| Winston Logger | ✅ New | Structured logging with file output |
| Rate Limiting | ✅ New | Multiple limiters per operation type |
| RBAC Middleware | ✅ New | Role-based access control |

### 3.5 CI/CD

| Feature | Status | Description |
|---------|--------|-------------|
| GitHub Actions | ✅ New | Automated testing pipeline |
| Slither Check | ✅ New | Security analysis in CI |
| Echidna Check | ✅ New | Fuzz testing in CI |

---

## 4. Proposed Features (Roadmap)

### 4.1 High Priority

#### 4.1.1 Meta-Transactions (Gasless)
- **Description:** Users sign transactions without paying gas via relayer
- **Benefit:** Better UX for non-crypto users
- **Implementation:** EIP-712 signed messages + relayer service

#### 4.1.2 Multi-Sig Support
- **Description:** Multi-signature wallet support for hospitals/insurance
- **Benefit:** Organizational-level security
- **Implementation:** Gnosis Safe integration or custom implementation

#### 4.1.3 Oracle Integration
- **Description:** Chainlink integration for external data
- **Use Cases:** 
  - Random numbers for key generation
  - Price feeds for insurance
  - Off-chain data verification

### 4.2 Medium Priority

#### 4.2.1 Gas Optimization
- **Description:** Optimize gas-heavy functions
- **Focus Areas:**
  - `getAllActivePolicies` loop optimization
  - Mapping iteration improvements
  - Storage packing

#### 4.2.2 IPFS Pinning Service
- **Description:** Reliable file storage with pinning
- **Implementation:** Pinata SDK with redundancy

#### 4.2.3 Upgradeable Contracts
- **Description:** UUPS proxy pattern for upgrades
- **Contracts:** Insurance, PatientDetails
- **Benefit:** Future upgradability without redeployment

### 4.3 Lower Priority

#### 4.3.1 Mobile App
- **Description:** React Native/Expo wrapper
- **Features:** Biometric auth, push notifications

#### 4.3.2 Analytics Dashboard
- **Description:** On-chain analytics visualization
- **Metrics:** User growth, transaction volume, data sales

#### 4.3.3 Social Recovery
- **Description:** Custodian wallet recovery via trusted contacts
- **Implementation:** Threshold signature scheme

#### 4.3.4 Notification System
- **Description:** Push notifications for:
  - Access requests
  - Claim status updates
  - Emergency access alerts

---

## 5. Security Requirements

### 5.1 Smart Contract Security

- [x] Slither static analysis
- [x] Reentrancy guards (nonReentrant)
- [x] Zero-address validation
- [x] Access control (OpenZeppelin AccessControl)
- [x] Immutable state variables
- [ ] Formal verification (future)
- [x] NatSpec documentation

### 5.2 API Security

- [x] Rate limiting (multiple tiers)
- [x] Input validation (express-validator)
- [x] Error handling with proper status codes
- [x] API key authentication
- [x] JWT authentication
- [ ] IP whitelist (future)

### 5.3 Backend Logging

- [x] Request/response logging
- [x] Error tracking with stack traces
- [x] Security event logging
- [x] Performance monitoring
- [x] Blockchain event logging

---

## 6. API Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 | 15 min |
| Authentication | 10 | 15 min |
| Write Operations | 20 | 1 min |
| Blockchain Calls | 10 | 1 min |
| File Uploads | 5 | 1 min |
| Search | 30 | 1 min |
| IPFS Operations | 15 | 1 min |

---

## 7. File Structure

```
Sanjeevni/
├── frontend/
│   ├── app/                    # Next.js pages
│   ├── components/             # UI components
│   ├── context/                # Web3Context
│   ├── hooks/lib/              # Auth utilities
│   ├── contracts/              # ABI files
│   ├── firebase.config.js      # Firebase config
│   └── package.json
│
├── contracts/
│   ├── contracts/              # Solidity contracts
│   │   ├── Patient.sol
│   │   ├── Doctor.sol
│   │   ├── Hospital.sol
│   │   ├── Insurance.sol
│   │   ├── Marketplace.sol
│   │   ├── PatientDetails.sol
│   │   ├── HandoffManager.sol
│   │   ├── InsuranceVerifier.sol
│   │   ├── MediSecureAccessControl.sol  # NEW
│   │   └── RBACDoctor.sol               # NEW
│   ├── migrations/             # Deployment scripts
│   ├── test/                   # Truffle tests
│   ├── scripts/
│   │   ├── run_slither.sh      # Security analysis
│   │   └── run_echidna.sh     # Fuzz testing
│   ├── echidna.config.json     # Fuzz config
│   └── package.json
│
├── server/
│   ├── index.js               # Express entry
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   │   ├── logger.js           # Winston logger
│   │   └── custodianWalletService.js
│   ├── middleware/
│   │   ├── security.js         # Rate limiting
│   │   └── logger.js           # Request logging
│   ├── logs/                   # Log files
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions
│
├── SECURITY_ANALYSIS.md        # Security findings
└── README.md
```

---

## 8. Deployment Checklist

### Development
- [x] Contracts compile
- [x] Tests pass
- [x] Slither analysis passes
- [x] Frontend builds
- [x] Backend starts

### Staging
- [ ] Deploy contracts to testnet (Sepolia/Holesky)
- [ ] Configure RPC URLs
- [ ] Set up IPFS gateway
- [ ] Verify contract addresses in frontend
- [ ] Run full test suite

### Production
- [ ] Deploy contracts to mainnet
- [ ] Etherscan verification
- [ ] Set up monitoring (logs, alerts)
- [ ] Configure rate limiting for production
- [ ] SSL/TLS setup
- [ ] Domain configuration

---

## 9. Dependencies

### Smart Contracts
- @openzeppelin/contracts: ^5.0.0
- @openzeppelin/contracts-upgradeable: ^5.0.0

### Frontend
- next: ^14.0.0
- react: ^18.2.0
- ethers: ^6.0.0
- firebase: ^10.0.0

### Backend
- express: ^5.0.0
- @prisma/client: ^5.8.0
- winston: ^3.0.0
- express-rate-limit: ^7.0.0
- socket.io: ^4.8.0

### Development/Tools
- truffle: ^5.11.0
- slither-analyzer: ^0.11.0
- echidna-fuzzing (via Docker)
- solhint: ^4.0.0

---

## 10. Future Considerations

### Scalability
- Layer 2 solutions (Polygon/Arbitrum)
- Off-chain data storage optimization
- Caching strategy

### Interoperability
- Cross-chain bridges
- DID (Decentralized Identity) integration
- Insurance data standards (FHIR)

### Monetization
- Token economy for data rewards
- Premium features via governance

---

## 11. Contributors

- Project Lead: Ayush Dubey
- Smart Contract Developer
- Frontend Developer
- Backend Developer

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-09 | Initial implementation with all core features |

---

*This document should be updated as features are implemented or new requirements are identified.*