#!/bin/bash

# =============================================================================
# ZedUno Ubuntu Server Update Script
# Updates existing ZedUno installation with latest changes
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Logging functions
log() { echo -e "${GREEN}[UPDATE] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${CYAN}[SUCCESS] $1${NC}"; }

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ███████╗███████╗██████╗ ██╗   ██╗███╗   ██╗ ██████╗          ║
║     ╚══███╔╝██╔════╝██╔══██╗██║   ██║████╗  ██║██╔═══██╗         ║
║       ███╔╝ █████╗  ██║  ██║██║   ██║██╔██╗ ██║██║   ██║         ║
║      ███╔╝  ██╔══╝  ██║  ██║██║   ██║██║╚██╗██║██║   ██║         ║
║     ███████╗███████╗██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝         ║
║     ╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝          ║
║                                                                  ║
║                    Ubuntu Update Script                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${NC}
"

echo
echo -e "${WHITE}ZedUno Update Script${NC}"
echo "This script will update your existing ZedUno installation with the latest changes."
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Detect installation location
APP_DIR=""
SERVICE_USER="zeduno"

log "Detecting ZedUno installation..."

if [[ -d "/opt/zeduno" ]] && [[ -f "/opt/zeduno/package.json" ]]; then
    APP_DIR="/opt/zeduno"
    log "Found production installation at $APP_DIR"
elif [[ -d "$HOME/zeduno" ]] && [[ -f "$HOME/zeduno/package.json" ]]; then
    APP_DIR="$HOME/zeduno"
    SERVICE_USER="$USER"
    log "Found development installation at $APP_DIR"
elif [[ -d "./zeduno" ]] && [[ -f "./zeduno/package.json" ]]; then
    APP_DIR="$(pwd)/zeduno"
    SERVICE_USER="$USER"
    log "Found installation in current directory: $APP_DIR"
elif [[ -f "./package.json" ]] && grep -q "zeduno" ./package.json 2>/dev/null; then
    APP_DIR="$(pwd)"
    SERVICE_USER="$USER"
    log "Found ZedUno in current directory: $APP_DIR"
else
    error "ZedUno installation not found. Please run from ZedUno directory or install first using deploy-ubuntu.sh"
fi

cd "$APP_DIR"

# Detect environment type
ENV_TYPE=""
if systemctl is-active --quiet pm2-$SERVICE_USER 2>/dev/null || sudo -u $SERVICE_USER pm2 list | grep -q "zeduno" 2>/dev/null; then
    ENV_TYPE="pm2"
    log "Detected PM2 environment"
elif [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.prod.yml" ]]; then
    ENV_TYPE="docker"
    log "Detected Docker environment"
else
    ENV_TYPE="manual"
    log "Manual installation detected"
fi

# Interactive update options
echo
echo -e "${YELLOW}=== UPDATE OPTIONS ===${NC}"
echo "1) Quick Update (pull code, update dependencies, rebuild, restart)"
echo "2) Full Update (includes system packages and security updates)"
echo "3) Safe Update (create backup first, then update)"
echo "4) Configuration Only (update configs without code changes)"
read -p "Choose update type (1-4) [1]: " update_choice

case $update_choice in
    2) FULL_UPDATE=true ;;
    3) CREATE_BACKUP=true ;;
    4) CONFIG_ONLY=true ;;
    *) QUICK_UPDATE=true ;;
esac

echo
echo -e "${CYAN}=== UPDATE SUMMARY ===${NC}"
echo "Installation Directory: $APP_DIR"
echo "Service User: $SERVICE_USER"
echo "Environment Type: $ENV_TYPE"
echo "Update Type: $([ "$FULL_UPDATE" == true ] && echo "Full Update" || [ "$CREATE_BACKUP" == true ] && echo "Safe Update" || [ "$CONFIG_ONLY" == true ] && echo "Configuration Only" || echo "Quick Update")"
echo

read -p "Continue with update? (Y/n): " continue_update
case $continue_update in
    [Nn]|[Nn][Oo]) error "Update cancelled by user" ;;
esac

echo
log "Starting ZedUno update..."

# =============================================================================
# BACKUP CREATION (if requested)
# =============================================================================

if [[ "$CREATE_BACKUP" == true ]]; then
    log "Creating backup before update..."
    
    BACKUP_DIR="/opt/backups/zeduno"
    DATE=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p $BACKUP_DIR
    
    # Backup database
    info "Backing up MongoDB database..."
    if command -v mongodump >/dev/null 2>&1; then
        mongodump --db zeduno --out $BACKUP_DIR/pre_update_db_$DATE --quiet
        success "Database backup created: $BACKUP_DIR/pre_update_db_$DATE"
    else
        warn "mongodump not found, skipping database backup"
    fi
    
    # Backup application
    info "Backing up application files..."
    tar -czf $BACKUP_DIR/pre_update_app_$DATE.tar.gz \
        --exclude='node_modules' \
        --exclude='backend/node_modules' \
        --exclude='dist' \
        --exclude='logs' \
        --exclude='.git' \
        -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"
    
    success "Application backup created: $BACKUP_DIR/pre_update_app_$DATE.tar.gz"
fi

# =============================================================================
# SYSTEM UPDATES (if full update)
# =============================================================================

if [[ "$FULL_UPDATE" == true ]]; then
    log "Updating system packages..."
    export DEBIAN_FRONTEND=noninteractive
    apt update
    apt upgrade -y
    
    # Update Node.js if needed
    NODE_CURRENT=$(node --version 2>/dev/null || echo "none")
    NODE_LATEST=$(curl -s https://nodejs.org/dist/index.json | jq -r '.[0].version' 2>/dev/null || echo "v20.0.0")
    
    if [[ "$NODE_CURRENT" != "$NODE_LATEST" ]]; then
        log "Updating Node.js from $NODE_CURRENT to $NODE_LATEST..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
        success "Node.js updated to $(node --version)"
    fi
    
    success "System packages updated"
fi

# =============================================================================
# STOP SERVICES
# =============================================================================

log "Stopping services for update..."

case "$ENV_TYPE" in
    "pm2")
        sudo -u $SERVICE_USER pm2 stop all || warn "Failed to stop PM2 services"
        ;;
    "docker")
        if [[ -f "docker-compose.prod.yml" ]]; then
            docker-compose -f docker-compose.prod.yml down
        else
            docker-compose down
        fi
        ;;
    "manual")
        warn "Manual environment detected - please stop your services manually if needed"
        ;;
esac

# =============================================================================
# CODE UPDATE
# =============================================================================

if [[ "$CONFIG_ONLY" != true ]]; then
    log "Updating application code..."
    
    # Check if git repo
    if [[ -d ".git" ]]; then
        # Stash any local changes
        sudo -u $SERVICE_USER git stash
        
        # Pull latest changes
        sudo -u $SERVICE_USER git pull origin main
        
        # Try to apply stashed changes
        sudo -u $SERVICE_USER git stash pop || warn "Could not apply stashed changes"
        
        success "Code updated from repository"
    else
        warn "Not a git repository - skipping code update"
        warn "Consider using 'git clone https://github.com/githuax/dine-serve-hub.git' to get the latest version"
    fi
    
    # Update dependencies
    log "Updating dependencies..."
    sudo -u $SERVICE_USER npm install
    
    if [[ -d "backend" ]]; then
        cd backend
        sudo -u $SERVICE_USER npm install
        cd ..
    fi
    
    success "Dependencies updated"
fi

# =============================================================================
# CONFIGURATION UPDATE
# =============================================================================

log "Updating configuration..."

# Get current server IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || hostname -I | awk '{print $1}')

# Update frontend environment if it exists
if [[ -f ".env.local" ]]; then
    info "Updating frontend configuration..."
    
    # Preserve custom settings while updating defaults
    source .env.local 2>/dev/null || true
    
    # Determine API URL based on current setup
    if [[ -n "$VITE_API_URL" ]]; then
        # Keep existing API URL but update domain if it changed
        CURRENT_API_URL="$VITE_API_URL"
    else
        # Create new API URL
        if systemctl is-active --quiet nginx 2>/dev/null && [[ -f "/etc/nginx/sites-available/zeduno" ]]; then
            CURRENT_API_URL="http://$PUBLIC_IP/api"
        else
            CURRENT_API_URL="http://$PUBLIC_IP:5000/api"
        fi
    fi
    
    cat > .env.local <<EOF
# ZedUno Frontend Environment - Updated $(date)
VITE_API_URL=$CURRENT_API_URL
VITE_APP_NAME=${VITE_APP_NAME:-ZedUno}
VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}
VITE_ENABLE_ANALYTICS=${VITE_ENABLE_ANALYTICS:-true}
VITE_ENABLE_PAYMENT_GATEWAYS=${VITE_ENABLE_PAYMENT_GATEWAYS:-true}
VITE_DEFAULT_CURRENCY=${VITE_DEFAULT_CURRENCY:-KES}
VITE_DEBUG=${VITE_DEBUG:-false}
EOF
    
    chown $SERVICE_USER:$SERVICE_USER .env.local
    success "Frontend configuration updated"
fi

# Update backend environment if it exists
if [[ -f "backend/.env" ]]; then
    info "Backend configuration is preserved - manual review recommended"
fi

# =============================================================================
# BUILD APPLICATION
# =============================================================================

if [[ "$CONFIG_ONLY" != true ]]; then
    log "Building application..."
    
    # Build frontend
    sudo -u $SERVICE_USER npm run build || error "Frontend build failed"
    
    success "Application built successfully"
fi

# =============================================================================
# UPDATE PM2 CONFIGURATION
# =============================================================================

if [[ "$ENV_TYPE" == "pm2" ]] && [[ -f "ecosystem.config.js" ]]; then
    info "Updating PM2 configuration..."
    
    # Check if ecosystem.config.js needs updates
    if ! grep -q "max_memory_restart" ecosystem.config.js; then
        log "Updating PM2 configuration with performance improvements..."
        
        sudo -u $SERVICE_USER bash << 'EOF'
cat > ecosystem.config.js <<EOL
module.exports = {
  apps: [
    {
      name: 'zeduno-backend',
      script: 'backend/src/server.ts',
      interpreter: 'node',
      interpreter_args: ['--loader', 'ts-node/esm'],
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_file: 'logs/backend.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    },
    {
      name: 'zeduno-frontend',
      script: 'serve',
      args: ['-s', 'dist', '-l', '3000', '-p', '3000'],
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_file: 'logs/frontend.log',
      time: true,
      max_memory_restart: '200M',
      restart_delay: 1000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
EOL
EOF
        success "PM2 configuration updated"
    fi
fi

# =============================================================================
# START SERVICES
# =============================================================================

log "Starting services..."

case "$ENV_TYPE" in
    "pm2")
        # Ensure required global packages are installed
        npm list -g serve ts-node typescript >/dev/null 2>&1 || {
            log "Installing missing global packages..."
            npm install -g serve ts-node typescript
        }
        
        # Start services
        sudo -u $SERVICE_USER pm2 start ecosystem.config.js
        sudo -u $SERVICE_USER pm2 save
        
        # Show status
        sudo -u $SERVICE_USER pm2 status
        ;;
    "docker")
        if [[ -f "docker-compose.prod.yml" ]]; then
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
        else
            docker-compose build
            docker-compose up -d
        fi
        
        # Show status
        docker-compose ps
        ;;
    "manual")
        success "Manual environment - please start your services manually"
        ;;
esac

# =============================================================================
# VERIFICATION
# =============================================================================

log "Verifying update..."

# Wait for services to start
sleep 10

# Check services
FRONTEND_OK=false
BACKEND_OK=false

# Test frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    FRONTEND_OK=true
    success "Frontend is responding"
else
    warn "Frontend may not be responding correctly"
fi

# Test backend
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    BACKEND_OK=true
    success "Backend API is responding"
else
    warn "Backend API may not be responding correctly"
fi

# Update health check script if it exists
if [[ -f "/opt/zeduno/health-check.sh" ]]; then
    info "Running health check..."
    /opt/zeduno/health-check.sh || warn "Health check reported issues"
fi

# =============================================================================
# CLEANUP
# =============================================================================

log "Performing cleanup..."

# Clean npm cache
sudo -u $SERVICE_USER npm cache clean --force >/dev/null 2>&1 || true

# Clean old logs (keep last 7 days)
find $APP_DIR/logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Clean old PM2 logs
sudo -u $SERVICE_USER pm2 flush >/dev/null 2>&1 || true

success "Cleanup completed"

# =============================================================================
# UPDATE COMPLETE
# =============================================================================

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     🎉 UPDATE COMPLETE! 🎉            ${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Update deployment info file
if [[ -f "$APP_DIR/DEPLOYMENT_INFO.txt" ]]; then
    echo "" >> $APP_DIR/DEPLOYMENT_INFO.txt
    echo "Last Updated: $(date)" >> $APP_DIR/DEPLOYMENT_INFO.txt
    echo "Update Type: $([ "$FULL_UPDATE" == true ] && echo "Full Update" || [ "$CREATE_BACKUP" == true ] && echo "Safe Update" || [ "$CONFIG_ONLY" == true ] && echo "Configuration Only" || echo "Quick Update")" >> $APP_DIR/DEPLOYMENT_INFO.txt
fi

if [[ $FRONTEND_OK == true && $BACKEND_OK == true ]]; then
    success "All services are running successfully!"
else
    warn "Some services may need attention. Check the logs:"
    echo "  - Frontend logs: $APP_DIR/logs/frontend*.log"
    echo "  - Backend logs: $APP_DIR/logs/backend*.log"
    if [[ "$ENV_TYPE" == "pm2" ]]; then
        echo "  - PM2 logs: sudo -u $SERVICE_USER pm2 logs"
    fi
fi

echo
echo -e "${CYAN}Access your updated ZedUno installation:${NC}"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo -e "🌐 Main URL: ${WHITE}http://$PUBLIC_IP${NC}"
    echo -e "🔧 Admin Panel: ${WHITE}http://$PUBLIC_IP/superadmin/login${NC}"
else
    echo -e "🌐 Main URL: ${WHITE}http://$PUBLIC_IP:3000${NC}"
    echo -e "🔧 Admin Panel: ${WHITE}http://$PUBLIC_IP:3000/superadmin/login${NC}"
fi

if [[ "$CREATE_BACKUP" == true ]]; then
    echo
    echo -e "${BLUE}Backup Information:${NC}"
    echo "Backups created in: /opt/backups/zeduno/"
    echo "- Database: pre_update_db_$DATE"
    echo "- Application: pre_update_app_$DATE.tar.gz"
fi

echo
echo -e "${YELLOW}Post-Update Checklist:${NC}"
echo "✅ Test login functionality"
echo "✅ Verify all features are working"
echo "✅ Check for any error messages"
echo "✅ Test from different devices/browsers"
echo "✅ Review application logs for issues"

echo
echo -e "${GREEN}Service Management Commands:${NC}"
if [[ "$ENV_TYPE" == "pm2" ]]; then
    echo "Status: sudo -u $SERVICE_USER pm2 status"
    echo "Logs: sudo -u $SERVICE_USER pm2 logs"
    echo "Restart: sudo -u $SERVICE_USER pm2 restart all"
elif [[ "$ENV_TYPE" == "docker" ]]; then
    echo "Status: docker-compose ps"
    echo "Logs: docker-compose logs -f"
    echo "Restart: docker-compose restart"
fi

echo
echo -e "${PURPLE}Update completed successfully! 🚀${NC}"

# Create update log entry
echo "$(date): ZedUno updated successfully - Type: $([ "$FULL_UPDATE" == true ] && echo "Full" || [ "$CREATE_BACKUP" == true ] && echo "Safe" || [ "$CONFIG_ONLY" == true ] && echo "Config" || echo "Quick")" >> /var/log/zeduno-updates.log

log "Update completed successfully! 🎉"

exit 0