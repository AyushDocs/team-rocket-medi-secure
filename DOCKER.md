# Sanjeevni - Docker Deployment Guide

## Quick Start

### Using Docker (Recommended)
```bash
# Start all services
./docker.sh start

# Check status
./docker.sh status

# Stop services
./docker.sh stop
```

### Manual Setup
```bash
# Start Ganache first
cd contracts && npm run dev:ganache

# In another terminal - deploy contracts
cd contracts && ./deploy.mjs deploy

# Start backend
cd server && npm run dev

# Start frontend
cd frontend && npm run dev
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js web app |
| Backend | 3001 | Express API server |
| Ganache | 8545 | Local blockchain |

## Available Scripts

### Native Scripts
```bash
# Deploy contracts
./contracts/deploy.mjs deploy

# Check contract status
./contracts/deploy.mjs status

# Validate deployment
./contracts/deploy.mjs validate

# Full startup
./start.sh start

# Check status
./start.sh status

# Stop services
./start.sh stop
```

### Docker Scripts
```bash
# Build and start
./docker.sh start

# View logs
./docker.sh logs

# Clean up
./docker.sh clean

# Rebuild (no cache)
./docker.sh build
```

## Environment Variables

### Backend (.env)
```
PORT=3001
GANACHE_URL=http://localhost:8545
WEB3_PROVIDER=http://localhost:8545
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WEB3_URL=http://localhost:8545
```

## Troubleshooting

### Contracts not deploying
```bash
# Check Ganache is running
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Redeploy
./contracts/deploy.mjs deploy
```

### Frontend can't connect to blockchain
```bash
# Check backend health
curl http://localhost:3001/health

# Verify contracts
./contracts/deploy.mjs validate
```

### Port conflicts
Stop other services using those ports:
```bash
# Find process on port
lsof -i :8545
lsof -i :3000
lsof -i :3001
```

## Contract Addresses

After deployment, contracts are synced to:
- `frontend/contracts/` - For web3 integration
- `contracts/build/contracts/` - Build artifacts

Check addresses:
```bash
cat contracts/build/contracts/Address.json
```
