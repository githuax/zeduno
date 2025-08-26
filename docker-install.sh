#!/bin/bash

# =============================================================================
# ZedUno Docker Installation Script for Ubuntu 25.04
# =============================================================================
# 
# Simplified Docker-based installation
# Usage: curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/docker-install.sh | bash
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_URL="https://github.com/githuax/dine-serve-hub.git"
APP_DIR="/opt/zeduno"
DOMAIN=""
SSL_EMAIL=""
USE_SSL="false"

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }

get_config() {
    echo -e "${BLUE}ZedUno Docker Installation${NC}"
    echo "=========================="
    
    read -p "Enter domain name (optional, press Enter for IP access): " DOMAIN
    
    if [[ -n "$DOMAIN" ]]; then
        read -p "Enable SSL/HTTPS? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            USE_SSL="true"
            read -p "Email for SSL certificate: " SSL_EMAIL
        fi
    fi
}

install_docker() {
    if command -v docker &> /dev/null; then
        success "Docker already installed"
        return
    fi
    
    log "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    success "Docker installed"
}

setup_application() {
    log "Setting up application..."
    
    # Clone repository
    if [[ -d "$APP_DIR" ]]; then
        sudo rm -rf "$APP_DIR"
    fi
    
    sudo git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    
    # Generate secure passwords
    MONGODB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Create production environment file
    sudo tee "$APP_DIR/.env.production" > /dev/null <<EOF
NODE_ENV=production
MONGODB_URI=mongodb://admin:${MONGODB_PASSWORD}@mongodb:27017/zeduno?authSource=admin
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://localhost}
BACKEND_URL=${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://localhost}
MONGODB_PASSWORD=${MONGODB_PASSWORD}
EOF
    
    # Update docker-compose for production
    sudo tee "$APP_DIR/docker-compose.prod.yml" > /dev/null <<EOF
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: zeduno-mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
      MONGO_INITDB_DATABASE: zeduno
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - zeduno-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: zeduno-backend-prod
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - zeduno-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: zeduno-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - zeduno-network

volumes:
  mongodb_data:

networks:
  zeduno-network:
    driver: bridge
EOF
    
    success "Application configured"
}

create_dockerfiles() {
    log "Creating production Dockerfiles..."
    
    # Backend production Dockerfile
    sudo tee "$APP_DIR/backend/Dockerfile.prod" > /dev/null <<EOF
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF
    
    # Frontend production Dockerfile
    sudo tee "$APP_DIR/Dockerfile.prod" > /dev/null <<EOF
# Build stage
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Install certbot for SSL
RUN apk add --no-cache certbot certbot-nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF
    
    success "Dockerfiles created"
}

setup_nginx() {
    log "Setting up Nginx configuration..."
    
    sudo mkdir -p "$APP_DIR/nginx/conf.d"
    
    if [[ -n "$DOMAIN" ]]; then
        sudo tee "$APP_DIR/nginx/conf.d/default.conf" > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Uploads
    location /uploads/ {
        proxy_pass http://backend:5000;
    }
}
EOF
    else
        sudo tee "$APP_DIR/nginx/conf.d/default.conf" > /dev/null <<EOF
server {
    listen 80;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    # Uploads
    location /uploads/ {
        proxy_pass http://backend:5000;
    }
}
EOF
    fi
    
    success "Nginx configured"
}

setup_ssl() {
    if [[ "$USE_SSL" != "true" ]] || [[ -z "$DOMAIN" ]]; then
        return
    fi
    
    log "Setting up SSL certificate..."
    
    # Create directories
    sudo mkdir -p /etc/letsencrypt
    sudo mkdir -p /var/www/certbot
    
    # Get certificate using standalone mode first
    sudo docker run --rm -p 80:80 -v "/etc/letsencrypt:/etc/letsencrypt" -v "/var/www/certbot:/var/www/certbot" certbot/certbot certonly --standalone --email "$SSL_EMAIL" --agree-tos --non-interactive -d "$DOMAIN"
    
    success "SSL certificate obtained"
}

start_services() {
    log "Starting services..."
    
    cd "$APP_DIR"
    
    # Build and start containers
    sudo docker-compose -f docker-compose.prod.yml build
    sudo docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    sleep 30
    
    success "Services started"
}

setup_firewall() {
    log "Configuring firewall..."
    
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    
    success "Firewall configured"
}

show_summary() {
    local access_url
    if [[ -n "$DOMAIN" ]]; then
        access_url="http${USE_SSL:+s}://$DOMAIN"
    else
        access_url="http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
    fi
    
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   ZedUno Docker Installation Complete   ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "Access URL: ${BLUE}$access_url${NC}"
    echo -e "API Docs: ${BLUE}$access_url/api-docs${NC}"
    echo
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo -e "  View logs: ${BLUE}cd $APP_DIR && sudo docker-compose -f docker-compose.prod.yml logs -f${NC}"
    echo -e "  Restart: ${BLUE}cd $APP_DIR && sudo docker-compose -f docker-compose.prod.yml restart${NC}"
    echo -e "  Stop: ${BLUE}cd $APP_DIR && sudo docker-compose -f docker-compose.prod.yml down${NC}"
    echo
    success "Installation complete! 🎉"
}

main() {
    echo -e "${BLUE}ZedUno Docker Installation${NC}"
    echo "========================="
    
    # Check requirements
    if [[ $EUID -eq 0 ]]; then
        error "Do not run as root"
    fi
    
    get_config
    install_docker
    setup_application
    create_dockerfiles
    setup_nginx
    setup_ssl
    setup_firewall
    start_services
    show_summary
}

main "$@"