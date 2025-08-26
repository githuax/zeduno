#!/bin/bash

# =============================================================================
# ZedUno Update Script - Update existing installation
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[UPDATE] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      ZedUno Update Script              ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Detect installation location
if [[ -d "/opt/zeduno" ]]; then
    APP_DIR="/opt/zeduno"
    log "Found production installation at $APP_DIR"
elif [[ -d "$HOME/zeduno" ]]; then
    APP_DIR="$HOME/zeduno"
    log "Found development installation at $APP_DIR"
elif [[ -d "./backend" ]]; then
    APP_DIR="$(pwd)"
    log "Using current directory: $APP_DIR"
else
    error "ZedUno installation not found. Please run from ZedUno directory or install first."
fi

cd "$APP_DIR"

# Check if git repo
if [[ -d ".git" ]]; then
    log "Pulling latest changes from GitHub..."
    git stash
    git pull origin main
    git stash pop || true
else
    warn "Not a git repository. Skipping code update."
fi

# Detect environment
if command -v pm2 &> /dev/null && pm2 list | grep -q "zeduno"; then
    ENV_TYPE="pm2"
    log "Detected PM2 environment"
elif [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.prod.yml" ]]; then
    ENV_TYPE="docker"
    log "Detected Docker environment"
else
    ENV_TYPE="manual"
    log "Manual installation detected"
fi

# Update dependencies
log "Updating dependencies..."
npm install
cd backend && npm install && cd ..

# Build application
log "Building application..."
npm run build

# Update environment configuration
if [[ ! -f ".env.local" ]]; then
    log "Creating environment configuration..."
    
    # Try to detect IP/domain
    if [[ -n "$DOMAIN" ]]; then
        API_URL="https://$DOMAIN/api"
    elif command -v curl &> /dev/null; then
        PUBLIC_IP=$(curl -s ifconfig.me)
        API_URL="http://$PUBLIC_IP/api"
    else
        API_URL="http://localhost/api"
    fi
    
    cat > .env.local <<EOF
VITE_API_URL=$API_URL
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
EOF
    info "API URL configured as: $API_URL"
fi

# Restart services based on environment
log "Restarting services..."

case "$ENV_TYPE" in
    "pm2")
        pm2 restart all
        pm2 save
        success="PM2 services restarted"
        ;;
    "docker")
        if [[ -f "docker-compose.prod.yml" ]]; then
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
        else
            docker-compose down
            docker-compose build
            docker-compose up -d
        fi
        success="Docker services restarted"
        ;;
    "manual")
        warn "Please restart your services manually"
        success="Build completed"
        ;;
esac

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}        Update Complete! 🎉            ${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${GREEN}$success${NC}"
echo

# Show access information
if [[ -f ".env.local" ]]; then
    source .env.local
    echo -e "Access URL: ${BLUE}${VITE_API_URL%/api}${NC}"
fi

# Show service status
case "$ENV_TYPE" in
    "pm2")
        echo
        echo "Service Status:"
        pm2 status
        ;;
    "docker")
        echo
        echo "Container Status:"
        docker-compose ps
        ;;
esac

echo
log "Update completed successfully! 🚀"