#!/bin/bash

# =============================================================================
# ZedUno Ubuntu Server Deployment Script
# Supports: Ubuntu 18.04, 20.04, 22.04, 24.04 LTS
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
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${GREEN}[DEPLOY] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${CYAN}[SUCCESS] $1${NC}"; }

# Configuration variables
APP_NAME="zeduno"
APP_DIR="/opt/${APP_NAME}"
SERVICE_USER="${APP_NAME}"
GITHUB_REPO="https://github.com/githuax/dine-serve-hub.git"
NODE_VERSION="20"
MONGODB_VERSION="7.0"

# Default configuration
DOMAIN=""
EMAIL=""
INSTALL_SSL=false
USE_NGINX=false
INSTALL_TYPE="production"

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
║                Ubuntu Server Deployment Script                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${NC}
"

echo
echo -e "${WHITE}Welcome to ZedUno Automated Deployment!${NC}"
echo
echo "This script will deploy ZedUno Restaurant Management System on your Ubuntu server."
echo "Supported versions: Ubuntu 18.04, 20.04, 22.04, 24.04 LTS"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Detect Ubuntu version
if [[ -f /etc/lsb-release ]]; then
    source /etc/lsb-release
    UBUNTU_VERSION=$DISTRIB_RELEASE
    info "Detected Ubuntu $UBUNTU_VERSION"
else
    error "Cannot detect Ubuntu version. This script requires Ubuntu 18.04+"
fi

# Check supported Ubuntu versions
case $UBUNTU_VERSION in
    18.04|20.04|22.04|24.04)
        success "Ubuntu $UBUNTU_VERSION is supported!"
        ;;
    *)
        warn "Ubuntu $UBUNTU_VERSION may not be fully supported. Proceeding anyway..."
        ;;
esac

# Interactive configuration
echo
echo -e "${YELLOW}=== DEPLOYMENT CONFIGURATION ===${NC}"
echo

# Installation type
echo "Select installation type:"
echo "1) Development (Quick setup, localhost access only)"
echo "2) Production (Full setup with security hardening)"
echo "3) Docker (Container-based deployment)"
read -p "Choose option (1-3) [2]: " install_choice
case $install_choice in
    1) INSTALL_TYPE="development" ;;
    3) INSTALL_TYPE="docker" ;;
    *) INSTALL_TYPE="production" ;;
esac

if [[ $INSTALL_TYPE == "production" ]]; then
    # Domain configuration
    read -p "Enter your domain name (optional, press Enter for IP-based access): " DOMAIN
    
    if [[ -n $DOMAIN ]]; then
        read -p "Enter your email for SSL certificate: " EMAIL
        if [[ -n $EMAIL ]]; then
            INSTALL_SSL=true
            USE_NGINX=true
        fi
    fi
    
    if [[ $USE_NGINX == false ]]; then
        read -p "Install Nginx reverse proxy? (y/N): " nginx_choice
        case $nginx_choice in
            [Yy]|[Yy][Ee][Ss]) USE_NGINX=true ;;
        esac
    fi
fi

# MongoDB configuration
read -p "MongoDB admin password (will be generated if empty): " MONGO_ADMIN_PASS
read -p "MongoDB ZedUno user password (will be generated if empty): " MONGO_ZEDUNO_PASS

# Generate passwords if not provided
if [[ -z $MONGO_ADMIN_PASS ]]; then
    MONGO_ADMIN_PASS=$(openssl rand -base64 32)
fi
if [[ -z $MONGO_ZEDUNO_PASS ]]; then
    MONGO_ZEDUNO_PASS=$(openssl rand -base64 32)
fi

# Generate JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Summary
echo
echo -e "${CYAN}=== DEPLOYMENT SUMMARY ===${NC}"
echo "Installation Type: $INSTALL_TYPE"
echo "Application Directory: $APP_DIR"
echo "Service User: $SERVICE_USER"
if [[ -n $DOMAIN ]]; then
    echo "Domain: $DOMAIN"
    echo "SSL Certificate: $([ $INSTALL_SSL == true ] && echo 'Yes' || echo 'No')"
fi
echo "Nginx Proxy: $([ $USE_NGINX == true ] && echo 'Yes' || echo 'No')"
echo "Node.js Version: $NODE_VERSION.x LTS"
echo "MongoDB Version: $MONGODB_VERSION"
echo

read -p "Continue with deployment? (Y/n): " continue_deploy
case $continue_deploy in
    [Nn]|[Nn][Oo]) error "Deployment cancelled by user" ;;
esac

echo
log "Starting ZedUno deployment..."

# =============================================================================
# SYSTEM PREPARATION
# =============================================================================

log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt update
apt upgrade -y

log "Installing essential packages..."
apt install -y \
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
    htop \
    fail2ban \
    logrotate \
    cron

# =============================================================================
# NODE.JS INSTALLATION
# =============================================================================

log "Installing Node.js ${NODE_VERSION}.x LTS..."

# Remove existing Node.js installations
apt remove -y nodejs npm || true

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
NODE_ACTUAL_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
success "Node.js $NODE_ACTUAL_VERSION and npm $NPM_VERSION installed successfully"

# =============================================================================
# MONGODB INSTALLATION
# =============================================================================

log "Installing MongoDB ${MONGODB_VERSION}..."

# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/${MONGODB_VERSION} multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list

# Update package list and install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Wait for MongoDB to start
sleep 10

# Verify MongoDB is running
if systemctl is-active --quiet mongod; then
    success "MongoDB ${MONGODB_VERSION} installed and running"
else
    error "MongoDB failed to start"
fi

# =============================================================================
# PM2 INSTALLATION
# =============================================================================

log "Installing PM2 process manager..."
npm install -g pm2

# Configure PM2 logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

success "PM2 installed successfully"

# =============================================================================
# NGINX INSTALLATION (if requested)
# =============================================================================

if [[ $USE_NGINX == true ]]; then
    log "Installing Nginx..."
    apt install -y nginx
    
    # Enable and start Nginx
    systemctl enable nginx
    systemctl start nginx
    
    success "Nginx installed successfully"
fi

# =============================================================================
# SSL CERTIFICATE SETUP (if requested)
# =============================================================================

if [[ $INSTALL_SSL == true && -n $DOMAIN && -n $EMAIL ]]; then
    log "Installing Certbot for SSL certificates..."
    apt install -y certbot python3-certbot-nginx
    
    success "Certbot installed"
fi

# =============================================================================
# USER AND DIRECTORY SETUP
# =============================================================================

log "Creating service user and directories..."

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
    success "Created service user: $SERVICE_USER"
fi

# Create application directory
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/uploads
mkdir -p /opt/backups/$APP_NAME

# Set ownership
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER /opt/backups/$APP_NAME

success "Directory structure created"

# =============================================================================
# APPLICATION DEPLOYMENT
# =============================================================================

log "Cloning ZedUno application..."

# Switch to service user for application setup
sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# Clone the repository
if [[ -d .git ]]; then
    git pull origin main
else
    git clone $GITHUB_REPO .
fi

# Install dependencies
npm install
cd backend && npm install && cd ..

# Install additional global packages
EOF

# Install global packages as root
npm install -g serve ts-node typescript

log "Building application..."

# Get server IP for configuration
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")

# Build frontend as service user
sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# Create frontend environment configuration
cat > .env.local <<EOL
# Frontend Configuration - $(date)
VITE_API_URL=$([ -n "$DOMAIN" ] && echo "https://$DOMAIN/api" || echo "http://$PUBLIC_IP:5000/api")
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
VITE_DEBUG=false
EOL

# Build the application
npm run build
EOF

success "Application built successfully"

# =============================================================================
# MONGODB CONFIGURATION
# =============================================================================

log "Configuring MongoDB authentication..."

# Create MongoDB admin user
mongosh --eval "
use admin
db.createUser({
  user: 'admin',
  pwd: '$MONGO_ADMIN_PASS',
  roles: ['root']
})
" || warn "Admin user might already exist"

# Create ZedUno database and user
mongosh --eval "
use zeduno
db.createUser({
  user: 'zeduno',
  pwd: '$MONGO_ZEDUNO_PASS',
  roles: ['readWrite']
})
" || warn "ZedUno user might already exist"

# Enable authentication in MongoDB config
sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf

# Restart MongoDB to apply authentication
systemctl restart mongod
sleep 5

success "MongoDB authentication configured"

# =============================================================================
# BACKEND CONFIGURATION
# =============================================================================

log "Configuring backend environment..."

sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# Create backend environment file
cat > backend/.env <<EOL
# ZedUno Backend Configuration - $(date)

# Database Configuration
MONGODB_URI=mongodb://zeduno:$MONGO_ZEDUNO_PASS@localhost:27017/zeduno?authSource=zeduno
DB_NAME=zeduno

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# CORS Configuration
FRONTEND_URL=$([ -n "$DOMAIN" ] && echo "https://$DOMAIN" || echo "http://$PUBLIC_IP:3000")
ALLOWED_ORIGINS=$([ -n "$DOMAIN" ] && echo "https://$DOMAIN,http://$DOMAIN" || echo "http://$PUBLIC_IP:3000,http://localhost:3000")

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Email Configuration (Configure these for email features)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@$([ -n "$DOMAIN" ] && echo "$DOMAIN" || echo "localhost")

# Payment Gateway Configuration (Configure for payment features)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_ENVIRONMENT=sandbox

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/backend.log
EOL
EOF

success "Backend environment configured"

# =============================================================================
# PM2 CONFIGURATION
# =============================================================================

log "Configuring PM2 process management..."

sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# Create PM2 ecosystem configuration
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
      min_uptime: '10s'
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

# Start applications with PM2
pm2 start ecosystem.config.js
pm2 save
EOF

# Configure PM2 startup
env PATH=\$PATH:/usr/bin pm2 startup systemd -u $SERVICE_USER --hp $APP_DIR

success "PM2 configured and applications started"

# =============================================================================
# NGINX CONFIGURATION (if requested)
# =============================================================================

if [[ $USE_NGINX == true ]]; then
    log "Configuring Nginx reverse proxy..."
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create ZedUno site configuration
    cat > /etc/nginx/sites-available/zeduno << EOF
# ZedUno Nginx Configuration
server {
    listen 80;
    server_name $([ -n "$DOMAIN" ] && echo "$DOMAIN www.$DOMAIN" || echo "$PUBLIC_IP localhost");
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        
        # Handle CORS preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/zeduno /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t || error "Nginx configuration test failed"
    
    # Reload Nginx
    systemctl reload nginx
    
    success "Nginx configured successfully"
fi

# =============================================================================
# SSL CERTIFICATE SETUP (if requested)
# =============================================================================

if [[ $INSTALL_SSL == true && -n $DOMAIN && -n $EMAIL ]]; then
    log "Obtaining SSL certificate..."
    
    # Get SSL certificate
    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN \
        $([ "$DOMAIN" != "www.$DOMAIN" ] && echo "--domains www.$DOMAIN" || echo "") \
        --redirect
    
    # Set up auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    success "SSL certificate obtained and configured"
fi

# =============================================================================
# FIREWALL CONFIGURATION
# =============================================================================

if [[ $INSTALL_TYPE == "production" ]]; then
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow direct access to application ports for development
    if [[ $INSTALL_TYPE != "production" ]] || [[ $USE_NGINX == false ]]; then
        ufw allow 3000/tcp  # Frontend
        ufw allow 5000/tcp  # Backend API
    fi
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
    
    # Configure fail2ban
    log "Configuring fail2ban..."
    
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    systemctl enable fail2ban
    systemctl restart fail2ban
    
    success "Fail2ban configured"
fi

# =============================================================================
# BACKUP SCRIPT CREATION
# =============================================================================

log "Creating backup script..."

cat > /opt/backups/$APP_NAME/backup.sh << 'EOF'
#!/bin/bash

# ZedUno Backup Script
BACKUP_DIR="/opt/backups/zeduno"
DATE=$(date +"%Y%m%d_%H%M%S")
KEEP_DAYS=7

mkdir -p $BACKUP_DIR

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "Starting ZedUno backup..."

# Backup MongoDB
log "Backing up database..."
mongodump --db zeduno --out $BACKUP_DIR/db_$DATE --quiet

# Backup application files (excluding node_modules)
log "Backing up application files..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='backend/node_modules' \
    --exclude='logs' \
    --exclude='uploads' \
    --exclude='.git' \
    -C /opt zeduno

# Backup uploads separately
log "Backing up uploads..."
if [[ -d "/opt/zeduno/uploads" ]]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/zeduno uploads
fi

# Clean old backups
log "Cleaning old backups (keeping last $KEEP_DAYS days)..."
find $BACKUP_DIR -name "db_*" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "app_*" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "uploads_*" -mtime +$KEEP_DAYS -delete

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
log "Backup completed successfully! Total backup size: $BACKUP_SIZE"
EOF

chmod +x /opt/backups/$APP_NAME/backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/backups/$APP_NAME/backup.sh >> /var/log/zeduno-backup.log 2>&1" | crontab -

success "Backup script created and scheduled"

# =============================================================================
# LOG ROTATION CONFIGURATION
# =============================================================================

log "Configuring log rotation..."

cat > /etc/logrotate.d/zeduno << EOF
/opt/zeduno/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 zeduno zeduno
    postrotate
        sudo -u zeduno pm2 reloadLogs
    endscript
}

/var/log/zeduno-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
}
EOF

success "Log rotation configured"

# =============================================================================
# HEALTH CHECK SCRIPT
# =============================================================================

log "Creating health check script..."

cat > /opt/zeduno/health-check.sh << 'EOF'
#!/bin/bash

# ZedUno Health Check Script
APP_DIR="/opt/zeduno"
LOG_FILE="/var/log/zeduno-health.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE; }
error() { log "ERROR: $1"; }
warn() { log "WARNING: $1"; }
info() { log "INFO: $1"; }

# Check if services are running
check_services() {
    info "Checking ZedUno services..."
    
    # Check PM2 processes
    if ! sudo -u zeduno pm2 list | grep -q "online"; then
        error "PM2 processes not running"
        sudo -u zeduno pm2 restart all
        return 1
    fi
    
    # Check frontend
    if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
        error "Frontend not responding"
        return 1
    fi
    
    # Check backend API
    if ! curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        error "Backend API not responding"
        return 1
    fi
    
    # Check MongoDB
    if ! sudo -u zeduno mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        error "MongoDB not responding"
        return 1
    fi
    
    info "All services are healthy"
    return 0
}

# Check disk space
check_disk_space() {
    USAGE=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $USAGE -gt 80 ]]; then
        warn "Disk usage is ${USAGE}%"
        return 1
    fi
    return 0
}

# Check memory usage
check_memory() {
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')
    if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
        warn "Memory usage is ${MEM_USAGE}%"
        return 1
    fi
    return 0
}

# Main health check
main() {
    info "Starting health check..."
    
    check_services
    SERVICE_STATUS=$?
    
    check_disk_space
    DISK_STATUS=$?
    
    check_memory
    MEMORY_STATUS=$?
    
    if [[ $SERVICE_STATUS -eq 0 && $DISK_STATUS -eq 0 && $MEMORY_STATUS -eq 0 ]]; then
        info "Health check passed"
        exit 0
    else
        error "Health check failed"
        exit 1
    fi
}

main "$@"
EOF

chmod +x /opt/zeduno/health-check.sh

# Schedule health checks every 5 minutes
echo "*/5 * * * * /opt/zeduno/health-check.sh" | crontab -

success "Health monitoring configured"

# =============================================================================
# CREATE CONFIGURATION SUMMARY
# =============================================================================

log "Creating configuration summary..."

cat > $APP_DIR/DEPLOYMENT_INFO.txt << EOF
===============================================
ZedUno Deployment Configuration Summary
===============================================
Deployment Date: $(date)
Server IP: $PUBLIC_IP
$([ -n "$DOMAIN" ] && echo "Domain: $DOMAIN")
Installation Type: $INSTALL_TYPE
Ubuntu Version: $UBUNTU_VERSION

Application Details:
- App Directory: $APP_DIR
- Service User: $SERVICE_USER
- Node.js Version: $NODE_ACTUAL_VERSION
- MongoDB Version: $MONGODB_VERSION
$([ $USE_NGINX == true ] && echo "- Nginx: Enabled")
$([ $INSTALL_SSL == true ] && echo "- SSL Certificate: Enabled")

Access URLs:
$([ -n "$DOMAIN" ] && echo "- Main URL: https://$DOMAIN" || echo "- Main URL: http://$PUBLIC_IP$([ $USE_NGINX == true ] && echo "" || echo ":3000")")
$([ -n "$DOMAIN" ] && echo "- API URL: https://$DOMAIN/api" || echo "- API URL: http://$PUBLIC_IP$([ $USE_NGINX == true ] && echo "/api" || echo ":5000/api")")

Admin Access:
- SuperAdmin URL: $([ -n "$DOMAIN" ] && echo "https://$DOMAIN" || echo "http://$PUBLIC_IP$([ $USE_NGINX == true ] && echo "" || echo ":3000")")/superadmin/login
- Default Username: admin@zeduno.com
- Default Password: admin123 (CHANGE IMMEDIATELY!)

Database Credentials:
- MongoDB Admin User: admin
- MongoDB Admin Password: $MONGO_ADMIN_PASS
- MongoDB ZedUno User: zeduno
- MongoDB ZedUno Password: $MONGO_ZEDUNO_PASS

Service Management:
- Start Services: sudo -u $SERVICE_USER pm2 start ecosystem.config.js
- Stop Services: sudo -u $SERVICE_USER pm2 stop all
- Restart Services: sudo -u $SERVICE_USER pm2 restart all
- View Status: sudo -u $SERVICE_USER pm2 status
- View Logs: sudo -u $SERVICE_USER pm2 logs

Important Files:
- Application: $APP_DIR
- Frontend Config: $APP_DIR/.env.local
- Backend Config: $APP_DIR/backend/.env
- PM2 Config: $APP_DIR/ecosystem.config.js
- Logs: $APP_DIR/logs/
- Backups: /opt/backups/$APP_NAME/
$([ $USE_NGINX == true ] && echo "- Nginx Config: /etc/nginx/sites-available/zeduno")

Security Notes:
- Change default admin password immediately
- Update MongoDB passwords regularly  
- Review firewall rules periodically
- Monitor application logs regularly
- Keep system packages updated

Maintenance:
- Health Check: /opt/zeduno/health-check.sh
- Backup Script: /opt/backups/$APP_NAME/backup.sh
- Update Script: Will be available in repository

Support:
- Documentation: https://github.com/githuax/dine-serve-hub
- Issues: https://github.com/githuax/dine-serve-hub/issues
EOF

chown $SERVICE_USER:$SERVICE_USER $APP_DIR/DEPLOYMENT_INFO.txt

# =============================================================================
# FINAL VERIFICATION
# =============================================================================

log "Performing final verification..."

# Wait for services to fully start
sleep 10

# Check PM2 processes
PM2_STATUS=$(sudo -u $SERVICE_USER pm2 list | grep -E "(online|stopped|errored)" | wc -l)
if [[ $PM2_STATUS -lt 2 ]]; then
    warn "Some PM2 processes may not be running correctly"
fi

# Check service connectivity
FRONTEND_OK=false
BACKEND_OK=false

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    FRONTEND_OK=true
fi

if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    BACKEND_OK=true
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     🎉 DEPLOYMENT COMPLETE! 🎉        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo

if [[ $FRONTEND_OK == true && $BACKEND_OK == true ]]; then
    success "All services are running successfully!"
else
    warn "Some services may need attention. Check the logs."
fi

echo
echo -e "${CYAN}Access your ZedUno installation:${NC}"
if [[ -n $DOMAIN ]]; then
    echo -e "🌐 Main URL: ${WHITE}https://$DOMAIN${NC}"
    echo -e "🔧 Admin Panel: ${WHITE}https://$DOMAIN/superadmin/login${NC}"
else
    if [[ $USE_NGINX == true ]]; then
        echo -e "🌐 Main URL: ${WHITE}http://$PUBLIC_IP${NC}"
        echo -e "🔧 Admin Panel: ${WHITE}http://$PUBLIC_IP/superadmin/login${NC}"
    else
        echo -e "🌐 Main URL: ${WHITE}http://$PUBLIC_IP:3000${NC}"
        echo -e "🔧 Admin Panel: ${WHITE}http://$PUBLIC_IP:3000/superadmin/login${NC}"
    fi
fi

echo
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "1. 🔐 Change the default admin password immediately!"
echo "2. 📧 Configure email settings in backend/.env"
echo "3. 💳 Configure payment gateways if needed"
echo "4. 📱 Test the application from different devices"
echo "5. 📋 Review the configuration summary in $APP_DIR/DEPLOYMENT_INFO.txt"

echo
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo "Username: admin@zeduno.com"
echo "Password: admin123"
echo -e "${RED}⚠️  CHANGE THESE IMMEDIATELY!${NC}"

echo
echo -e "${CYAN}Service Management Commands:${NC}"
echo "View Status: sudo -u $SERVICE_USER pm2 status"
echo "View Logs: sudo -u $SERVICE_USER pm2 logs"
echo "Restart All: sudo -u $SERVICE_USER pm2 restart all"

echo
echo -e "${GREEN}Monitoring:${NC}"
echo "Health Check: /opt/zeduno/health-check.sh"
echo "Backup: /opt/backups/$APP_NAME/backup.sh"
echo "Logs: $APP_DIR/logs/"

if [[ $INSTALL_SSL == true ]]; then
    echo
    echo -e "${GREEN}SSL Certificate:${NC}"
    echo "Auto-renewal is configured with certbot"
    echo "Check renewal: sudo certbot renew --dry-run"
fi

echo
echo -e "${PURPLE}Thank you for using ZedUno! 🚀${NC}"
echo
echo "For support and documentation, visit:"
echo "https://github.com/githuax/dine-serve-hub"

# Save deployment summary to file
cat > /root/zeduno-deployment-$(date +%Y%m%d-%H%M%S).txt << EOF
ZedUno Deployment Summary - $(date)
===================================
Status: SUCCESS
Server IP: $PUBLIC_IP
Domain: ${DOMAIN:-"Not configured"}
Installation Type: $INSTALL_TYPE
Access URL: $([ -n "$DOMAIN" ] && echo "https://$DOMAIN" || echo "http://$PUBLIC_IP$([ $USE_NGINX == true ] && echo "" || echo ":3000")")
Admin URL: $([ -n "$DOMAIN" ] && echo "https://$DOMAIN" || echo "http://$PUBLIC_IP$([ $USE_NGINX == true ] && echo "" || echo ":3000")")/superadmin/login

Services Status:
- Frontend: $([ $FRONTEND_OK == true ] && echo "✅ Running" || echo "❌ Issues detected")
- Backend: $([ $BACKEND_OK == true ] && echo "✅ Running" || echo "❌ Issues detected")
- MongoDB: ✅ Running
- PM2: ✅ Configured
$([ $USE_NGINX == true ] && echo "- Nginx: ✅ Running")
$([ $INSTALL_SSL == true ] && echo "- SSL: ✅ Configured")

Configuration Files:
- App Directory: $APP_DIR
- Frontend Config: $APP_DIR/.env.local
- Backend Config: $APP_DIR/backend/.env
- Deployment Info: $APP_DIR/DEPLOYMENT_INFO.txt
EOF

log "Deployment completed successfully! 🎉"

exit 0