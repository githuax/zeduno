#!/bin/bash

# =============================================================================
# ZedUno Quick Installation Script - Ubuntu 25.04
# =============================================================================
# 
# One-command installation for development/testing
# Usage: curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/quick-install.sh | bash
#
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[ZedUno] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "Please run as regular user (not root)"
fi

# Check Ubuntu version
if ! command -v lsb_release &> /dev/null || [[ "$(lsb_release -si)" != "Ubuntu" ]]; then
    error "This script is designed for Ubuntu systems"
fi

log "Starting ZedUno quick installation..."

# Update system
log "Updating system packages..."
sudo apt-get update -qq

# Install Node.js 20
log "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install MongoDB
log "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update -qq
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Install Git
sudo apt-get install -y git

# Clone repository
APP_DIR="$HOME/zeduno"
if [[ -d "$APP_DIR" ]]; then
    rm -rf "$APP_DIR"
fi

log "Downloading ZedUno..."
git clone https://github.com/githuax/dine-serve-hub.git "$APP_DIR"
cd "$APP_DIR"

# Create environment file
log "Configuring environment..."
MONGODB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 2>/dev/null || echo "defaultpassword123")
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32 2>/dev/null || echo "your-secret-key-here")

cat > backend/.env <<EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zeduno
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BACKEND_URL=http://localhost:5000
MPESA_ENVIRONMENT=sandbox
EOF

# Install dependencies
log "Installing dependencies..."
npm install
cd backend && npm install && cd ..

# Build application
log "Building application..."
npm run build:backend

# Start services
log "Starting MongoDB..."
sudo systemctl start mongod

# Install PM2 and start backend
log "Starting backend service..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

cd backend
pm2 start dist/server.js --name zeduno-backend
cd ..

# Start frontend in development mode
log "Starting frontend..."
pm2 start "npm run dev:frontend" --name zeduno-frontend

# Setup PM2 startup
pm2 save
pm2 startup | grep -E '^sudo' | bash || true

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}    ZedUno Quick Installation Complete!    ${NC}"
echo -e "${GREEN}============================================${NC}"
echo
echo -e "${YELLOW}Access URLs:${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC} or ${BLUE}http://${SERVER_IP}:5173${NC}"
echo -e "  Backend API: ${BLUE}http://localhost:5000${NC} or ${BLUE}http://${SERVER_IP}:5000${NC}"
echo -e "  API Docs: ${BLUE}http://localhost:5000/api-docs${NC}"
echo
echo -e "${YELLOW}Management Commands:${NC}"
echo -e "  View logs: ${BLUE}pm2 logs${NC}"
echo -e "  Restart services: ${BLUE}pm2 restart all${NC}"
echo -e "  Stop services: ${BLUE}pm2 stop all${NC}"
echo -e "  Service status: ${BLUE}pm2 status${NC}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Visit the frontend URL above"
echo -e "  2. Complete the setup wizard"
echo -e "  3. Create your restaurant tenant"
echo -e "  4. Configure payment methods"
echo -e "  5. Start managing your restaurant!"
echo
echo -e "${GREEN}Installation completed successfully! 🚀${NC}"