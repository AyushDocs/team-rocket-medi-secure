#!/bin/bash

set -e

NC='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker not installed"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose not installed"
        exit 1
    fi
    log_success "Docker ready"
}

compose() {
    if docker compose version &> /dev/null; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

print_banner() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          SANJEEVNI DOCKER STARTUP                        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

case "${1:-start}" in
    start|up)
        print_banner
        check_docker
        log_info "Starting all services..."
        compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --build
        log_info "Waiting for services to be ready..."
        sleep 10
        log_success "Services started!"
        echo ""
        echo "  Frontend:  http://localhost:3000"
        echo "  Backend:   http://localhost:3001"
        echo "  Ganache:   http://localhost:8545"
        echo ""
        echo "To view logs: $0 logs"
        echo "To stop:     $0 stop"
        ;;
        
    stop|down)
        log_info "Stopping services..."
        compose -f "$SCRIPT_DIR/docker-compose.yml" down
        log_success "All services stopped"
        ;;
        
    restart)
        log_info "Restarting services..."
        compose -f "$SCRIPT_DIR/docker-compose.yml" restart
        log_success "Services restarted"
        ;;
        
    logs)
        compose -f "$SCRIPT_DIR/docker-compose.yml" logs -f
        ;;
        
    status)
        compose -f "$SCRIPT_DIR/docker-compose.yml" ps
        ;;
        
    build)
        log_info "Building images..."
        compose -f "$SCRIPT_DIR/docker-compose.yml" build --no-cache
        log_success "Images built"
        ;;
        
    clean)
        log_info "Cleaning up..."
        compose -f "$SCRIPT_DIR/docker-compose.yml" down -v
        log_success "Cleaned up"
        ;;
        
    help|--help|-h)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     Build and start all services"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  logs      View logs"
        echo "  status    Show service status"
        echo "  build     Build images (no cache)"
        echo "  clean     Stop and remove all data"
        echo ""
        ;;
        
    *)
        log_error "Unknown command: $1"
        $0 help
        exit 1
        ;;
esac
