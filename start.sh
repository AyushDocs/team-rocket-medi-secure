#!/bin/bash

# Sanjeevni Complete Startup Script
# Starts all services: Ganache, Frontend, Backend

set -e

NC='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

check_ganache() {
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://127.0.0.1:8545 > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Core production contracts
CONTRACTS=(
    "Patient"
    "Doctor"
    "Hospital"
    "Insurance"
    "Marketplace"
    "WellnessRewards"
    "PriceMedianizer"
    "ConsentSBT"
    "SanjeevniToken"
    "MediSecureAccessControl"
    "PatientDetails"
)

deploy_contracts() {
    log_info "Synchronizing Blockchain State..."
    cd "$PROJECT_DIR/contracts"
    
    # Try to compile and migrate
    if ! npx truffle migrate --reset --network development; then
        log_error "Migration failed. Ensure Ganache is running on port 8545."
        exit 1
    fi
    
    log_info "Syncing ABI Artifacts to Frontend..."
    mkdir -p "$PROJECT_DIR/frontend/contracts"
    for contract in "${CONTRACTS[@]}"; do
        if [ -f "$PROJECT_DIR/contracts/build/contracts/$contract.json" ]; then
            cp "$PROJECT_DIR/contracts/build/contracts/$contract.json" "$PROJECT_DIR/frontend/contracts/"
            log_success "Synced $contract.json"
        else
            log_warn "Artifact $contract.json not found in build directory."
        fi
    done
}

check_contracts() {
    log_info "Validating Smart Contract Deployments..."
    for contract in "${CONTRACTS[@]}"; do
        FILE="$PROJECT_DIR/frontend/contracts/$contract.json"
        if [ ! -f "$FILE" ]; then
            log_error "$contract.json missing in frontend"
            return 1
        fi
        
        # Check for non-empty address in common Ganache network IDs (5777 or 1337)
        address=$(grep -o "\"address\":\"0x[a-fA-F0-9]\{40\}\"" "$FILE" | head -n 1 || echo "")
        
        if [ -z "$address" ]; then
            log_error "$contract artifact has no deployment address"
            return 1
        fi
    done
    return 0
}

start_backend() {
    log_info "Launching MediSecure Backend Relayer..."
    cd "$PROJECT_DIR/server"
    npm run dev > /dev/null 2>&1 &
    echo $! > "$PROJECT_DIR/.backend.pid"
    
    # Wait for backend to be ready
    MAX_RETRIES=10
    COUNT=0
    while ! curl -s http://localhost:3001/api/health > /dev/null 2>&1 && [ $COUNT -lt $MAX_RETRIES ]; do
        sleep 1
        ((COUNT++))
    done
    log_success "Backend active on port 3001"
}

start_frontend() {
    log_info "Igniting Sanjeevni Frontend (Next.js)..."
    cd "$PROJECT_DIR/frontend"
    npm run dev > /dev/null 2>&1 &
    echo $! > "$PROJECT_DIR/.frontend.pid"
    log_success "Frontend active on http://localhost:3000"
}

stop_services() {
    log_info "Decommissioning Sanjeevni Services..."
    [ -f "$PROJECT_DIR/.backend.pid" ] && kill $(cat "$PROJECT_DIR/.backend.pid") 2>/dev/null || true
    [ -f "$PROJECT_DIR/.frontend.pid" ] && kill $(cat "$PROJECT_DIR/.frontend.pid") 2>/dev/null || true
    rm -f "$PROJECT_DIR/.backend.pid" "$PROJECT_DIR/.frontend.pid"
    log_success "All services terminated."
}

show_status() {
    echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "           ${GREEN}SANJEEVNI PROTOCOL DASHBOARD${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
    
    if check_ganache; then
        echo -e "  ${GREEN}●${NC} GANACHE NETWORK   : ${GREEN}RUNNING${NC} (Port 8545)"
    else
        echo -e "  ${RED}○${NC} GANACHE NETWORK   : ${RED}STOPPED${NC}"
    fi
    
    if check_contracts > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} SMART CONTRACTS   : ${GREEN}DEPLOYED & SYNCED${NC}"
    else
        echo -e "  ${YELLOW}○${NC} SMART CONTRACTS   : ${YELLOW}OUT-OF-SYNC${NC} (Run: ./start.sh deploy)"
    fi

    echo -e "\n  ${BLUE}Services:${NC}"
    echo -e "  ➜ Frontend Dashboard : http://localhost:3000"
    echo -e "  ➜ API Relayer        : http://localhost:3001"
    echo -e "  ➜ Blockchain RPC     : http://localhost:8545"
    echo -e "\n${CYAN}──────────────────────────────────────────────────────────────${NC}\n"
}

case "${1:-status}" in
    start)
        if ! check_ganache; then
            log_error "Ganache not detected. Please start Ganache first."
            exit 1
        fi
        
        if ! check_contracts > /dev/null 2>&1; then
            log_warn "Contracts missing or out-of-sync. Initiating deployment..."
            deploy_contracts
        fi
        
        stop_services
        start_backend
        start_frontend
        show_status
        ;;
        
    deploy)
        if ! check_ganache; then
            log_error "Deployment requires an active Ganache network."
            exit 1
        fi
        deploy_contracts
        log_success "Deployment and Sync Phase Complete."
        ;;
        
    status)
        show_status
        ;;
        
    stop)
        stop_services
        ;;
        
    restart)
        stop_services
        sleep 1
        $0 start
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|deploy|status}"
        exit 1
        ;;
esac
