#!/bin/bash

# =============================================================================
# ZedUno Restaurant Management System - Ubuntu 25.04 Installation Script
# =============================================================================
# 
# This script automates the complete installation of ZedUno on Ubuntu 25.04
# 
# Usage: 
#   curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/install.sh | bash
#   or
#   wget -qO- https://raw.githubusercontent.com/githuax/dine-serve-hub/main/install.sh | bash
#
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/githuax/dine-serve-hub.git"
APP_NAME="zeduno"
APP_DIR="/opt/zeduno"
SERVICE_USER="zeduno"
DOMAIN=""
SSL_EMAIL=""
USE_SSL="false"
INSTALL_DOCKER="true"
INSTALL_PM2="true"
MONGODB_PASSWORD=""
JWT_SECRET=""

# System info
OS_VERSION=$(lsb_release -rs)
ARCH=$(uname -m)
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
CPU_CORES=$(nproc)

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Progress bar function
show_progress() {
    local duration=$1
    local message="$2"
    
    echo -n "$message"
    for ((i=1; i<=duration; i++)); do
        echo -n "."
        sleep 0.2
    done
    echo " ✓"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# Get user input securely (password)
get_secure_input() {
    local prompt="$1"
    local input
    
    read -s -p "$prompt: " input
    echo ""
    echo "$input"
}

# =============================================================================
# System Checks
# =============================================================================

check_system() {
    log "Checking system requirements..."
    
    # Check Ubuntu version
    if [[ "$OS_VERSION" != "25.04" ]] && [[ "$OS_VERSION" != "24.04" ]] && [[ "$OS_VERSION" != "22.04" ]]; then
        warn "This script is optimized for Ubuntu 25.04, but detected $OS_VERSION"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
    
    # Check sudo privileges
    if ! sudo -n true 2>/dev/null; then
        error "This script requires sudo privileges. Please ensure you can run sudo commands."
    fi
    
    # Check system resources
    if [[ $TOTAL_MEM -lt 2048 ]]; then
        warn "System has ${TOTAL_MEM}MB RAM. Recommended minimum is 2GB."
    fi
    
    if [[ $CPU_CORES -lt 2 ]]; then
        warn "System has ${CPU_CORES} CPU core(s). Recommended minimum is 2 cores."
    fi
    
    # Check disk space (need at least 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    if [[ $AVAILABLE_GB -lt 5 ]]; then
        error "Insufficient disk space. Available: ${AVAILABLE_GB}GB, Required: 5GB"
    fi
    
    success "System checks passed ✓"
}

# =============================================================================
# User Configuration
# =============================================================================

get_user_config() {
    log "Gathering configuration information..."
    
    echo -e "${CYAN}"
    echo "=========================================="
    echo "        ZedUno Installation Setup        "
    echo "=========================================="
    echo -e "${NC}"
    
    # Domain configuration
    echo -e "${WHITE}Domain Configuration:${NC}"
    DOMAIN=$(get_input "Enter your domain name (leave empty for IP-based access)" "")
    
    if [[ -n "$DOMAIN" ]]; then
        USE_SSL=$(get_input "Enable SSL/HTTPS with Let's Encrypt? (y/n)" "y")
        if [[ "$USE_SSL" =~ ^[Yy]$ ]]; then
            USE_SSL="true"
            SSL_EMAIL=$(get_input "Enter email for SSL certificate" "")
        else
            USE_SSL="false"
        fi
    fi
    
    echo
    echo -e "${WHITE}Database Configuration:${NC}"
    MONGODB_PASSWORD=$(get_input "MongoDB password (leave empty to auto-generate)" "$(generate_password)")
    
    echo
    echo -e "${WHITE}Security Configuration:${NC}"
    JWT_SECRET=$(get_input "JWT secret key (leave empty to auto-generate)" "$(generate_password)")
    
    echo
    echo -e "${WHITE}Installation Options:${NC}"
    INSTALL_DOCKER=$(get_input "Install Docker? (y/n)" "y")
    INSTALL_PM2=$(get_input "Install PM2 for process management? (y/n)" "y")
    
    # Summary
    echo
    echo -e "${CYAN}Installation Summary:${NC}"
    echo "• Domain: ${DOMAIN:-'IP-based access'}"
    echo "• SSL: ${USE_SSL}"
    echo "• Docker: ${INSTALL_DOCKER}"
    echo "• PM2: ${INSTALL_PM2}"
    echo
    
    read -p "Proceed with installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Installation cancelled."
        exit 0
    fi
}

# =============================================================================
# System Updates and Dependencies
# =============================================================================

update_system() {
    log "Updating system packages..."
    
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    
    # Install essential packages
    sudo apt-get install -y -qq \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        htop \
        nano \
        vim \
        tree \
        jq \
        openssl
    
    success "System updated successfully ✓"
}

# =============================================================================
# Node.js Installation
# =============================================================================

install_nodejs() {
    log "Installing Node.js..."
    
    if command_exists node; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        
        if [[ $major_version -ge 18 ]]; then
            success "Node.js $node_version already installed ✓"
            return
        fi
    fi
    
    # Install Node.js 20.x (LTS)
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    if command_exists node && command_exists npm; then
        local node_ver=$(node --version)
        local npm_ver=$(npm --version)
        success "Node.js $node_ver and npm $npm_ver installed ✓"
    else
        error "Node.js installation failed"
    fi
}

# =============================================================================
# MongoDB Installation
# =============================================================================

install_mongodb() {
    log "Installing MongoDB..."
    
    if command_exists mongod; then
        success "MongoDB already installed ✓"
        return
    fi
    
    # Import MongoDB public key
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update and install
    sudo apt-get update -qq
    sudo apt-get install -y mongodb-org
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    # Wait for MongoDB to be ready
    show_progress 10 "Waiting for MongoDB to start"
    
    # Create admin user
    mongosh --eval "
    use admin;
    db.createUser({
        user: 'admin',
        pwd: '$MONGODB_PASSWORD',
        roles: [
            { role: 'userAdminAnyDatabase', db: 'admin' },
            { role: 'readWriteAnyDatabase', db: 'admin' },
            { role: 'dbAdminAnyDatabase', db: 'admin' }
        ]
    });
    " || warn "Admin user might already exist"
    
    success "MongoDB installed and configured ✓"
}

# =============================================================================
# Docker Installation (Optional)
# =============================================================================

install_docker() {
    if [[ "$INSTALL_DOCKER" != "y" ]] && [[ "$INSTALL_DOCKER" != "true" ]]; then
        info "Skipping Docker installation"
        return
    fi
    
    log "Installing Docker..."
    
    if command_exists docker; then
        success "Docker already installed ✓"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    success "Docker and Docker Compose installed ✓"
    info "Please log out and log back in for Docker group membership to take effect"
}

# =============================================================================
# Nginx Installation and Configuration
# =============================================================================

install_nginx() {
    log "Installing and configuring Nginx..."
    
    sudo apt-get install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Configure firewall
    sudo ufw allow 'Nginx Full'
    
    success "Nginx installed ✓"
}

# =============================================================================
# SSL Certificate Setup
# =============================================================================

setup_ssl() {
    if [[ "$USE_SSL" != "true" ]] || [[ -z "$DOMAIN" ]]; then
        info "Skipping SSL setup"
        return
    fi
    
    log "Setting up SSL certificate with Let's Encrypt..."
    
    # Install Certbot
    sudo apt-get install -y certbot python3-certbot-nginx
    
    # Obtain certificate
    sudo certbot --nginx -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive --redirect
    
    # Setup auto-renewal
    sudo systemctl enable certbot.timer
    
    success "SSL certificate configured ✓"
}

# =============================================================================
# Application Setup
# =============================================================================

create_user() {
    log "Creating application user..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        info "User $SERVICE_USER already exists"
        return
    fi
    
    # Create system user
    sudo useradd --system --shell /bin/bash --home "$APP_DIR" --create-home "$SERVICE_USER"
    
    # Add to necessary groups
    sudo usermod -aG www-data "$SERVICE_USER"
    
    success "Application user created ✓"
}

download_application() {
    log "Downloading ZedUno application..."
    
    # Remove existing directory if it exists
    if [[ -d "$APP_DIR" ]]; then
        sudo rm -rf "$APP_DIR"
    fi
    
    # Clone repository
    sudo git clone "$REPO_URL" "$APP_DIR"
    
    # Set ownership
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
    
    success "Application downloaded ✓"
}

configure_environment() {
    log "Configuring environment variables..."
    
    # Create backend .env file
    sudo -u "$SERVICE_USER" tee "$APP_DIR/backend/.env" > /dev/null <<EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://admin:${MONGODB_PASSWORD}@localhost:27017/zeduno?authSource=admin

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://localhost}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Backend URL
BACKEND_URL=${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://localhost:5000}

# M-Pesa Configuration (Configure in admin panel)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_ENVIRONMENT=sandbox

# Payment Gateway Configuration (Configure in admin panel)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SQUARE_APPLICATION_ID=
SQUARE_ACCESS_TOKEN=
EOF
    
    success "Environment configured ✓"
}

install_dependencies() {
    log "Installing application dependencies..."
    
    # Install root dependencies
    cd "$APP_DIR"
    sudo -u "$SERVICE_USER" npm install --production
    
    # Install backend dependencies
    cd "$APP_DIR/backend"
    sudo -u "$SERVICE_USER" npm install --production
    
    success "Dependencies installed ✓"
}

build_application() {
    log "Building application..."
    
    cd "$APP_DIR"
    
    # Build backend
    sudo -u "$SERVICE_USER" npm run build:backend
    
    # Build frontend
    sudo -u "$SERVICE_USER" npm run build:frontend
    
    success "Application built ✓"
}

# =============================================================================
# Process Management Setup
# =============================================================================

install_pm2() {
    if [[ "$INSTALL_PM2" != "y" ]] && [[ "$INSTALL_PM2" != "true" ]]; then
        setup_systemd
        return
    fi
    
    log "Installing and configuring PM2..."
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    # Create PM2 ecosystem file
    sudo -u "$SERVICE_USER" tee "$APP_DIR/ecosystem.config.js" > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'zeduno-backend',
    script: './backend/dist/server.js',
    instances: ${CPU_CORES},
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/zeduno/combined.log',
    out_file: '/var/log/zeduno/out.log',
    error_file: '/var/log/zeduno/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Create log directory
    sudo mkdir -p /var/log/zeduno
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" /var/log/zeduno
    
    # Start application with PM2
    cd "$APP_DIR"
    sudo -u "$SERVICE_USER" pm2 start ecosystem.config.js
    
    # Setup PM2 startup
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$SERVICE_USER" --hp "$APP_DIR"
    sudo -u "$SERVICE_USER" pm2 save
    
    success "PM2 configured ✓"
}

setup_systemd() {
    log "Setting up systemd service..."
    
    # Create systemd service file
    sudo tee /etc/systemd/system/zeduno.service > /dev/null <<EOF
[Unit]
Description=ZedUno Restaurant Management System
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=zeduno

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and start service
    sudo systemctl daemon-reload
    sudo systemctl enable zeduno
    sudo systemctl start zeduno
    
    success "Systemd service configured ✓"
}

# =============================================================================
# Nginx Configuration
# =============================================================================

configure_nginx() {
    log "Configuring Nginx..."
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create ZedUno site configuration
    if [[ -n "$DOMAIN" ]]; then
        sudo tee /etc/nginx/sites-available/zeduno > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS (if SSL is enabled)
    $(if [[ "$USE_SSL" == "true" ]]; then
        echo "return 301 https://\$server_name\$request_uri;"
    else
        echo "# SSL not configured"
    fi)
}

$(if [[ "$USE_SSL" == "true" ]]; then
cat <<EOL
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
EOL
else
cat <<EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
EOL
fi)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Frontend static files
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # File uploads
    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
    else
        # IP-based configuration
        sudo tee /etc/nginx/sites-available/zeduno > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # File uploads
    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
    }
}
EOF
    fi
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/zeduno /etc/nginx/sites-enabled/
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    success "Nginx configured ✓"
}

# =============================================================================
# Security Configuration
# =============================================================================

configure_firewall() {
    log "Configuring firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (current connection)
    sudo ufw allow ssh
    
    # Allow web traffic
    sudo ufw allow 'Nginx Full'
    
    # Allow MongoDB only from localhost
    sudo ufw deny 27017
    
    success "Firewall configured ✓"
}

configure_fail2ban() {
    log "Configuring Fail2ban..."
    
    # Create Nginx jail configuration
    sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null <<EOF
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF
    
    # Restart Fail2ban
    sudo systemctl restart fail2ban
    
    success "Fail2ban configured ✓"
}

# =============================================================================
# Database Initialization
# =============================================================================

initialize_database() {
    log "Initializing database..."
    
    cd "$APP_DIR/backend"
    
    # Wait for backend to be ready
    show_progress 15 "Waiting for backend service to be ready"
    
    # Run database seeds if available
    if [[ -f "package.json" ]] && grep -q "seed:users" package.json; then
        sudo -u "$SERVICE_USER" npm run seed:users || warn "User seeding failed or users already exist"
    fi
    
    success "Database initialized ✓"
}

# =============================================================================
# Post-Installation
# =============================================================================

create_admin_user() {
    log "Creating default admin user..."
    
    # This would typically be done through the API or a seed script
    # For now, we'll provide instructions
    info "Default admin user creation should be done through the application interface"
    info "Visit your application and use the superadmin setup process"
}

cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    sudo apt-get autoremove -y -qq
    sudo apt-get autoclean -qq
    
    # Clear npm cache
    sudo -u "$SERVICE_USER" npm cache clean --force 2>/dev/null || true
    
    success "Cleanup completed ✓"
}

# =============================================================================
# Health Checks
# =============================================================================

run_health_checks() {
    log "Running health checks..."
    
    local errors=0
    
    # Check MongoDB
    if ! sudo systemctl is-active --quiet mongod; then
        error "MongoDB is not running"
        ((errors++))
    fi
    
    # Check application service
    if command_exists pm2; then
        if ! sudo -u "$SERVICE_USER" pm2 list | grep -q "online"; then
            warn "PM2 application might not be running"
            ((errors++))
        fi
    else
        if ! sudo systemctl is-active --quiet zeduno; then
            error "ZedUno service is not running"
            ((errors++))
        fi
    fi
    
    # Check Nginx
    if ! sudo systemctl is-active --quiet nginx; then
        error "Nginx is not running"
        ((errors++))
    fi
    
    # Test HTTP response
    if [[ -n "$DOMAIN" ]]; then
        local test_url="http${USE_SSL:+s}://$DOMAIN"
    else
        local test_url="http://localhost"
    fi
    
    if ! curl -f -s "$test_url" > /dev/null; then
        warn "Application is not responding at $test_url"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        success "All health checks passed ✓"
    else
        warn "Some health checks failed. Check the logs for more information."
    fi
    
    return $errors
}

# =============================================================================
# Installation Summary
# =============================================================================

show_summary() {
    local access_url
    if [[ -n "$DOMAIN" ]]; then
        access_url="http${USE_SSL:+s}://$DOMAIN"
    else
        access_url="http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
    fi
    
    echo
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}    ZedUno Installation Complete! 🎉      ${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo
    echo -e "${WHITE}Access Information:${NC}"
    echo -e "  Application URL: ${CYAN}$access_url${NC}"
    echo -e "  API URL: ${CYAN}$access_url/api${NC}"
    echo -e "  API Documentation: ${CYAN}$access_url/api-docs${NC}"
    echo
    echo -e "${WHITE}Default Credentials:${NC}"
    echo -e "  MongoDB Admin: ${CYAN}admin${NC} / ${CYAN}$MONGODB_PASSWORD${NC}"
    echo
    echo -e "${WHITE}Important Files:${NC}"
    echo -e "  Application: ${CYAN}$APP_DIR${NC}"
    echo -e "  Backend Config: ${CYAN}$APP_DIR/backend/.env${NC}"
    echo -e "  Nginx Config: ${CYAN}/etc/nginx/sites-available/zeduno${NC}"
    echo -e "  Logs: ${CYAN}/var/log/zeduno/${NC}"
    echo
    echo -e "${WHITE}Useful Commands:${NC}"
    if command_exists pm2; then
        echo -e "  View logs: ${CYAN}sudo -u $SERVICE_USER pm2 logs${NC}"
        echo -e "  Restart app: ${CYAN}sudo -u $SERVICE_USER pm2 restart all${NC}"
        echo -e "  App status: ${CYAN}sudo -u $SERVICE_USER pm2 status${NC}"
    else
        echo -e "  View logs: ${CYAN}sudo journalctl -u zeduno -f${NC}"
        echo -e "  Restart app: ${CYAN}sudo systemctl restart zeduno${NC}"
        echo -e "  App status: ${CYAN}sudo systemctl status zeduno${NC}"
    fi
    echo -e "  Restart nginx: ${CYAN}sudo systemctl restart nginx${NC}"
    echo -e "  Check firewall: ${CYAN}sudo ufw status${NC}"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Visit $access_url to access ZedUno"
    echo -e "  2. Complete the initial setup wizard"
    echo -e "  3. Create your first tenant/restaurant"
    echo -e "  4. Configure payment gateways in the admin panel"
    echo -e "  5. Add menu items and start taking orders!"
    echo
    echo -e "${GREEN}Support:${NC}"
    echo -e "  GitHub: ${CYAN}https://github.com/githuax/dine-serve-hub${NC}"
    echo -e "  Issues: ${CYAN}https://github.com/githuax/dine-serve-hub/issues${NC}"
    echo
    echo -e "${GREEN}Installation completed successfully! 🚀${NC}"
    echo
}

# =============================================================================
# Main Installation Flow
# =============================================================================

main() {
    # Header
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
     ______        _   _            
    |___  /       | | | |           
       / /   ___  __| | | |    _ __   ___  
      / /   / _ \/ _` | | |   | '_ \ / _ \ 
     / /   |  __/ (_| | | |___| | | | (_) |
    /_/     \___|\__,_| |_____|_| |_|\___/ 
                                          
    Restaurant Management System Installer
    Ubuntu 25.04 LTS
EOF
    echo -e "${NC}"
    
    # Pre-installation
    check_system
    get_user_config
    
    # System setup
    update_system
    install_nodejs
    install_mongodb
    install_docker
    install_nginx
    
    # Application setup
    create_user
    download_application
    configure_environment
    install_dependencies
    build_application
    
    # Service setup
    install_pm2
    configure_nginx
    
    # Security
    configure_firewall
    configure_fail2ban
    
    # SSL setup (if enabled)
    setup_ssl
    
    # Database initialization
    initialize_database
    
    # Post-installation
    cleanup
    
    # Health checks
    if run_health_checks; then
        show_summary
    else
        error "Installation completed with warnings. Please check the logs."
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Trap to handle interruption
trap 'echo -e "\n${RED}Installation interrupted!${NC}"; exit 1' INT TERM

# Check if script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi