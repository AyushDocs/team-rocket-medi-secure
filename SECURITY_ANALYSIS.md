# Security Analysis Report

## Static Analysis

This project uses [Slither](https://github.com/crytic/slither) for static analysis of smart contracts.

### Running Analysis

```bash
cd contracts
source venv/bin/activate
```
./scripts/run_slither.sh

Or run on individual contracts:
```bash
slither contracts/Insurance.sol --solc-remap '@openzeppelin/contracts=node_modules/@openzeppelin/contracts'
```

---

## Findings & Resolutions

### 1. Doctor.sol

| Issue | Severity | Status |
|-------|----------|--------|
| missing-zero-check in `setHospitalContract` | Medium | ✅ Fixed |
| immutable-states | Low | Noted - not critical |
| timestamp usage | Low | Noted - acceptable for this use case |
| naming-convention | Informational | Noted |

**Fix Applied**: Added zero-address validation in `setHospitalContract(address _addr)`:
```solidity
function setHospitalContract(address _addr) public onlyOwner {
    require(_addr != address(0), "Invalid zero address");
    hospitalContract = _addr;
}
```

---

### 2. Insurance.sol

| Issue | Severity | Status |
|-------|----------|--------|
| missing-zero-check in `setVerifier` | Medium | ✅ Fixed |
| shadowing-local in `processClaim` | Medium | ✅ Fixed |
| reentrancy-no-eth | Medium | ✅ Fixed (already had nonReentrant) |
| timestamp usage | Low | Noted - acceptable |
| low-level-calls | Low | Noted - necessary for ZK verification |
| dead-code | Informational | Noted - from OpenZeppelin dependencies |
| naming-convention | Informational | Noted |

**Fixes Applied**:

1. **Added Ownable and zero-address check to `setVerifier`**:
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract Insurance is ReentrancyGuard, Ownable {
    constructor() Ownable(msg.sender) {}

    function setVerifier(address _verifier) public onlyOwner {
        require(_verifier != address(0), "Invalid zero address");
        zkpVerifier = _verifier;
    }
}
```

2. **Renamed shadowing variable in `processClaim`**:
```solidity
function processClaim(uint256 _claimId, string memory _claimStatus) public onlyInsurance {
    Claim storage clm = claims[_claimId];
    // ... renamed _status to _claimStatus to avoid shadowing ReentrancyGuard._status
}
```

3. **Added nonReentrant to `finalizePolicy`** (for cross-function reentrancy protection):
```solidity
function finalizePolicy(uint256 _requestId) public onlyInsurance nonReentrant {
    // ...
}
```

---

### 3. Patient.sol

| Issue | Severity | Status |
|-------|----------|--------|
| shadowing-local | Low | Noted - shadows ERC721._name (expected for ERC721) |
| divide-before-multiply | Low | Noted - from OpenZeppelin Math library |
| incorrect-exp | Low | Noted - from OpenZeppelin |
| assembly | Low | Noted - from OpenZeppelin |

**Note**: These issues are from OpenZeppelin dependency code, not project code.

---

### 4. Other Contracts

| Contract | Issues | Status |
|----------|--------|--------|
| HandoffManager.sol | dead-code, timestamp, naming | Noted - minimal risk |
| Hospital.sol | naming-convention | Noted |
| Marketplace.sol | dead-code, low-level-calls | Noted |
| PatientDetails.sol | assembly, dead-code, unindexed-event | Noted |
| InsuranceVerifier.sol | assembly, incorrect-return | Noted - expected for ZK verifier |

---

## Security Improvements Summary

| Date | Change | File | Line |
|------|--------|------|------|
| 2026-04-10 | Locked Solidity version to 0.8.20 | All Contracts | 2 |
| 2026-04-10 | Added zero-address check to constructors/setters | All Contracts | Various |
| 2026-04-10 | Fixed ZK Verifier call using explicit interface | Insurance.sol | 223 |
| 2026-04-10 | Refactored getPatientSummary to fix Stack Too Deep | Patient.sol | 409-425 |
| 2026-04-10 | Standardized loop counters to uint256 | All Contracts | Various |
| 2026-04-10 | Resolved naming convention and shadowing issues | Patient.sol, Insurance.sol | Various |
| 2026-04-10 | Removed unused local variables | Doctor.sol | 435, 444 |

---

## Security Enhancements Applied

### Doctor.sol
- **ReentrancyGuard**: Protects against reentrancy attacks on state-changing functions
- **Pausable**: Allows emergency stopping of critical functions (pause/unpause)
- **AccessControl**: Role-based access (ADMIN_ROLE, DOCTOR_ROLE) replaces owner-only
- **Rate Limiting**: Max 10 access requests per hour to prevent abuse
- **Input Validation**: Added checks for zero addresses, valid IPFS hashes, duration limits
- **Emergency Pausable**: emergencyBreakGlass respects pause state

### Patient.sol
- **ReentrancyGuard**: Protects state-changing functions (update, add records/nominees)
- **Pausable**: Emergency stop capability for contract
- **AccessControl**: Role-based (ADMIN_ROLE, INSURANCE_ROLE)
- **Input Validation**: Username length (3-30), name (1-100), email (1-100), age (1-150)
- **OnlyRegisteredPatient modifier**: Cleaner access control

---

## Recommendations

1. ✅ Add zero-address checks in critical functions - **Done**
2. ✅ Add nonReentrant guards for cross-function reentrancy - **Done**
3. ✅ Mark immutable state variables (owner in Doctor.sol) - **Done**
4. ✅ Add Pausable for emergency stop - **Done**
5. ✅ Add AccessControl for role-based permissions - **Done**
6. ✅ Add rate limiting on sensitive functions - **Done**
7. ✅ Add comprehensive input validation - **Done**
8. Run tests with Ganache before deploying to testnet
9. Consider upgrading Solidity version when bugs are fixed by team
10. Consider upgrading to OZ 5.x for improved security features

---

## Remaining Issues (Acceptable)

The following are informational/low priority and don't affect security:
- **naming-convention**: Mostly resolved; some remaining in OZ dependencies or internal private variables.
- **timestamp**: Using `block.timestamp` for access expiration is acceptable and standard.
- **low-level-calls**: Minimal usage, mostly abstracted via interfaces.
- **assembly**: Expected in ZK verifier and OZ library code.
- **dead-code**: From OpenZeppelin dependencies.

---

## Running Tests

```bash
# Compile contracts
npm run compile

# Run tests (requires Ganache on port 8545)
npm test

# Run Slither analysis
./scripts/run_slither.sh
```

---

## Fuzz Testing (Echidna)

This project uses [Echidna](https://github.com/crytic/echidna) for property-based fuzz testing.

### Running Echidna

```bash
cd contracts
./scripts/run_echidna.sh
```

Or run directly with Docker:
```bash
docker run --rm -v $(pwd):/project trailofbits/eth-security-toolbox \
    echidna-test /project/contracts/contracts/InsuranceFuzzTest.sol \
    --config /project/contracts/echidna.config.json
```

### Fuzz Test Contracts

| Contract | Purpose |
|----------|---------|
| `InsuranceFuzzTest.sol` | Tests insurance request/verify/finalize invariants |
| `DoctorFuzzTest.sol` | Tests doctor registration and access invariants |

### Invariants Tested

- **Finalized must be verified**: A request cannot be finalized without prior verification
- **Active policy has provider**: Active policies must have valid provider association
- **Request bounds**: Request counters cannot go negative
- **Doctor count**: Doctor count cannot be negative
- **Access bounds**: Access request count cannot go negative

---

## NatSpec Documentation

All public functions have been documented with NatSpec comments:

| Contract | Status | Public Functions |
|----------|--------|------------------|
| Doctor.sol | ✅ Complete | 14 functions |
| Patient.sol | ✅ Complete | 12 functions |
| Insurance.sol | ✅ Complete | 15 functions |
| HandoffManager.sol | ✅ Existing | 5 functions |
| Hospital.sol | ✅ Existing | 9 functions |
| Marketplace.sol | ✅ Existing | 8 functions |
| PatientDetails.sol | ✅ Existing | 7 functions |

### Generating Documentation

Use `solc --userdoc --devdoc` to generate NatSpec:
```bash
solc contracts/Doctor.sol --userdoc --devdoc --combined-json abi > docs/doctor.json
```

---

## Security Checklist

- [x] Slither static analysis
- [x] Fix critical/medium security issues
- [x] Add NatSpec documentation
- [x] Setup Echidna fuzz testing
- [x] CI/CD pipeline
- [ ] Run full test suite (requires Ganache)
- [ ] Deploy to testnet
- [ ] Verify contracts on Etherscan

---

## CI/CD Pipeline

This project uses GitHub Actions for automated testing and security analysis.

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Main CI pipeline |

### Pipeline Stages

1. **Compile** - Compile all contracts
2. **Slither** - Run static analysis
3. **Echidna** - Run fuzz tests
4. **Test** - Run unit tests (requires Ganache)
5. **Lint** - Solhint linting

### Running Locally

```bash
# Install dependencies
npm ci

# Compile
npm run compile

# Test (requires Ganache)
npm test

# Slither
source venv/bin/activate
./scripts/run_slither.sh

# Echidna
./scripts/run_echidna.sh

# Lint
npx solhint 'contracts/**/*.sol'
```