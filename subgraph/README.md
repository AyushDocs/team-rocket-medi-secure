# Sanjeevni Subgraph

The Graph indexing solution for Sanjeevni decentralized healthcare platform.

## Overview

This subgraph indexes events from:
- **Patient.sol** - Patient registration, medical records, emergency access
- **Doctor.sol** - Doctor registration, access management
- **Insurance.sol** - Insurance providers, policies, claims
- **Hospital.sol** - Hospital management, doctor duty tracking
- **MultiSigWallet.sol** - Multi-signature transactions

## Setup

```bash
# Install dependencies
cd subgraph
npm install

# Generate types
npm run codegen

# Build subgraph
npm run build
```

## Deployment

### Local (using Docker)
```bash
# Start local graph node
docker run -d -p 8000:8000 -p 8001:8001 -p 8020:8020 -v $(pwd)/data:/graph-node/data \
  graphprotocol/graph-node:latest \
  --postgres-url postgresql://postgres:password@localhost:5432/graph \
  --ipfs http://localhost:5001 \
  --ethereum "mainnet:http://localhost:8545"

# Deploy to local
npm run deploy-local
```

### Testnet (Sepolia)
```bash
# Create deployment key at https://thegraph.com/explorer/
graph auth https://api.thegraph.com/deploy <DEPLOYMENT_KEY>

# Update subgraph.yaml with your contract addresses
# Then deploy
npm run deploy --sanjeevni/sepolia
```

### Mainnet
```bash
graph auth https://api.thegraph.com/deploy <DEPLOYMENT_KEY>
npm run deploy --sanjeevni/mainnet
```

## Schema

| Entity | Description |
|--------|-------------|
| Patient | Registered patient info |
| MedicalRecord | NFT medical records |
| Doctor | Registered doctors |
| InsuranceProvider | Insurance companies |
| Policy | Insurance policies |
| InsuranceRequest | Quote requests |
| Claim | Insurance claims |
| AccessGrant | Doctor access to patient records |
| Transaction | Multi-sig transactions |

## Queries

Example GraphQL query:
```graphql
{
  patients(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    name
    wallet
    recordCount
    createdAt
  }
}
```

## Updating

1. Update `subgraph.yaml` with new contract addresses
2. Run `npm run codegen` to regenerate types
3. Run `npm run build`
4. Deploy with `npm run deploy`