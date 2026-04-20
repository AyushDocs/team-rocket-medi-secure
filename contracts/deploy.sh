#!/bin/bash

# Sanjeevni Deployment Helper Script
# This script handles compilation, deployment, and validation of all smart contracts

set -e

NC='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CONTRACTS_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$CONTRACTS_DIR/../frontend"

# Colors for contract deployment status
declare -A CONTRACT_STATUS
CONTRACT_STATUS=(
    ["Patient"]="pending"
    ["Doctor"]="pending"
    ["Hospital"]="pending"
    ["Insurance"]="pending"
    ["Marketplace"]="pending"
    ["PatientDetails"]="pending"
    ["HandoffManager"]="pending"
)

print_banner() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          SANJEEVNI SMART CONTRACT DEPLOYMENT              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_ganache() {
    log_info "Checking if Ganache is running..."
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://127.0.0.1:8545 > /dev/null 2>&1; then
        log_success "Ganache is running"
    else
        log_error "Ganache is not running on port 8545"
        log_info "Please start Ganache and try again"
        exit 1
    fi
}

compile_contracts() {
    log_info "Compiling smart contracts..."
    cd "$CONTRACTS_DIR"
    
    npx truffle compile --compile-all --force
    
    log_success "Contracts compiled successfully"
}

deploy_contracts() {
    log_info "Deploying contracts to network..."
    cd "$CONTRACTS_DIR"
    
    npx truffle migrate --reset --compile-all --network development
    
    log_success "Contracts deployed successfully"
}

sync_frontend() {
    log_info "Syncing contracts to frontend..."
    
    mkdir -p "$FRONTEND_DIR/contracts"
    
    # Copy all contract artifacts
    for contract in Patient Doctor Hospital Insurance Marketplace PatientDetails HandoffManager; do
        if [ -f "$CONTRACTS_DIR/build/contracts/$contract.json" ]; then
            cp "$CONTRACTS_DIR/build/contracts/$contract.json" "$FRONTEND_DIR/contracts/"
        fi
    done
    
    # Generate contract addresses file
    cat > "$FRONTEND_DIR/contracts/addresses.json" << 'EOF'
{
  "network": "development",
  "deployedAt": "EOF
    echo -n "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$FRONTEND_DIR/contracts/addresses.json"
    cat >> "$FRONTEND_DIR/contracts/addresses.json" << 'EOF'"
}
EOF
    
    log_success "Contracts synced to frontend"
}

validate_deployment() {
    log_info "Validating deployment..."
    
    local failed=0
    local address_file="$CONTRACTS_DIR/build/contracts/Address.json"
    
    if [ ! -f "$address_file" ]; then
        log_error "Address.json not found"
        exit 1
    fi
    
    echo ""
    echo "Deployed Contract Addresses:"
    echo "────────────────────────────"
    
    for contract in Patient Doctor Hospital Insurance Marketplace PatientDetails HandoffManager; do
        local address=$(grep -o "\"$contract\":.*" "$address_file" | grep -o "0x[a-fA-F0-9]{40}" | head -1)
        if [ -n "$address" ]; then
            echo -e "${GREEN}✓${NC} $contract: $address"
            CONTRACT_STATUS[$contract]="deployed"
        else
            echo -e "${RED}✗${NC} $contract: NOT DEPLOYED"
            CONTRACT_STATUS[$contract]="failed"
            failed=1
        fi
    done
    
    echo "────────────────────────────"
    
    if [ $failed -eq 1 ]; then
        log_error "Some contracts failed to deploy"
        exit 1
    fi
    
    log_success "All contracts deployed successfully"
}

health_check() {
    log_info "Running health check..."
    
    cd "$CONTRACTS_DIR"
    
    local failed=0
    
    # Check if contracts respond to calls
    for contract in Patient Doctor Hospital Insurance; do
        local address=$(grep -o "\"$contract\":.*" "$CONTRACTS_DIR/build/contracts/Address.json" | grep -o "0x[a-fA-F0-9]{40}" | head -1)
        
        if [ -n "$address" ]; then
            # Try a simple contract call
            if npx truffle exec scripts/seed_data.js --network development 2>/dev/null | grep -q "Network"; then
                log_success "$contract: responding"
            else
                log_warn "$contract: may not be fully initialized"
            fi
        fi
    done
    
    log_success "Health check complete"
}

show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy      Full deployment (compile + deploy + sync)"
    echo "  compile     Only compile contracts"
    echo "  migrate     Only deploy contracts"
    echo "  sync        Only sync to frontend"
    echo "  validate    Validate deployment"
    echo "  health      Run health check"
    echo "  all         Full deployment + validation + health check"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 all"
}

main() {
    print_banner
    
    case "${1:-deploy}" in
        deploy)
            check_ganache
            compile_contracts
            deploy_contracts
            sync_frontend
            validate_deployment
            ;;
        compile)
            compile_contracts
            ;;
        migrate)
            check_ganache
            deploy_contracts
            ;;
        sync)
            sync_frontend
            ;;
        validate)
            validate_deployment
            ;;
        health)
            health_check
            ;;
        all)
            check_ganache
            compile_contracts
            deploy_contracts
            sync_frontend
            validate_deployment
            health_check
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
