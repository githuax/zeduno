#!/bin/bash

# =============================================================================
# ZedUno Deployment Script
# =============================================================================
# 
# This script handles various deployment scenarios for ZedUno
# Usage: ./deploy.sh [option]
#
# Options:
#   quick     - Quick development setup
#   prod      - Full production deployment
#   docker    - Docker-based deployment
#   update    - Update existing installation
#   backup    - Backup data and configuration
#   restore   - Restore from backup
#
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/zeduno-backups"
LOG_FILE="/var/log/zeduno-deploy.log"

# Utility functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}" >&2
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
    exit 1
}

warn() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

info() {
    local message="[INFO] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_system() {
    info "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine operating system"
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        warn "This script is optimized for Ubuntu. Detected: $ID $VERSION_ID"
    fi
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "Do not run this script as root. Use a regular user with sudo privileges."
    fi
    
    # Check sudo privileges
    if ! sudo -n true 2>/dev/null; then
        error "This script requires sudo privileges."
    fi
    
    success "System requirements check passed"
}

# Quick development setup
quick_setup() {
    log "Starting quick development setup..."
    
    if [[ -f "./quick-install.sh" ]]; then
        chmod +x ./quick-install.sh
        ./quick-install.sh
    else
        curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/quick-install.sh | bash
    fi
    
    success "Quick setup completed"
}

# Full production deployment
production_setup() {
    log "Starting production deployment..."
    
    if [[ -f "./install.sh" ]]; then
        chmod +x ./install.sh
        ./install.sh
    else
        curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/install.sh | bash
    fi
    
    success "Production deployment completed"
}

# Docker deployment
docker_setup() {
    log "Starting Docker deployment..."
    
    if [[ -f "./docker-install.sh" ]]; then
        chmod +x ./docker-install.sh
        ./docker-install.sh
    else
        curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/docker-install.sh | bash
    fi
    
    success "Docker deployment completed"
}

# Update existing installation
update_deployment() {
    log "Updating ZedUno installation..."
    
    local app_dir="/opt/zeduno"
    if [[ ! -d "$app_dir" ]]; then
        app_dir="$HOME/zeduno"
    fi
    
    if [[ ! -d "$app_dir" ]]; then
        error "ZedUno installation not found. Please run initial setup first."
    fi
    
    cd "$app_dir"
    
    # Backup current installation
    backup_data "pre-update-$(date +%Y%m%d-%H%M%S)"
    
    # Pull latest changes
    log "Pulling latest changes..."
    git pull origin main
    
    # Install dependencies
    log "Updating dependencies..."
    npm install
    cd backend && npm install && cd ..
    
    # Build application
    log "Building application..."
    npm run build
    
    # Restart services
    if command_exists pm2; then
        log "Restarting PM2 services..."
        pm2 restart all
    elif command_exists docker-compose; then
        log "Restarting Docker services..."
        docker-compose -f docker-compose.prod.yml restart
    else
        log "Restarting systemd services..."
        sudo systemctl restart zeduno
    fi
    
    # Health check
    sleep 10
    if curl -f -s http://localhost/health >/dev/null; then
        success "Update completed successfully"
    else
        warn "Update completed but health check failed. Please check logs."
    fi
}

# Backup data and configuration
backup_data() {
    local backup_name="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup MongoDB
    if command_exists mongodump; then
        log "Backing up MongoDB..."
        mongodump --uri="mongodb://localhost:27017/zeduno" --out="$backup_path/mongodb"
    fi
    
    # Backup application files
    local app_dir="/opt/zeduno"
    if [[ ! -d "$app_dir" ]]; then
        app_dir="$HOME/zeduno"
    fi
    
    if [[ -d "$app_dir" ]]; then
        log "Backing up application files..."
        tar -czf "$backup_path/app-files.tar.gz" -C "$app_dir" . --exclude=node_modules --exclude=.git --exclude=dist
    fi
    
    # Backup configuration files
    log "Backing up configuration files..."
    mkdir -p "$backup_path/config"
    
    # Nginx config
    if [[ -f "/etc/nginx/sites-available/zeduno" ]]; then
        cp /etc/nginx/sites-available/zeduno "$backup_path/config/"
    fi
    
    # Environment files
    if [[ -f "$app_dir/backend/.env" ]]; then
        cp "$app_dir/backend/.env" "$backup_path/config/"
    fi
    
    # PM2 config
    if command_exists pm2; then
        pm2 save >/dev/null
        if [[ -f "$HOME/.pm2/dump.pm2" ]]; then
            cp "$HOME/.pm2/dump.pm2" "$backup_path/config/"
        fi
    fi
    
    # Create backup manifest
    cat > "$backup_path/manifest.txt" <<EOF
ZedUno Backup Manifest
Created: $(date)
Backup Name: $backup_name
System: $(uname -a)
Node Version: $(node --version 2>/dev/null || echo "Not installed")
MongoDB Version: $(mongod --version 2>/dev/null | head -1 || echo "Not installed")

Contents:
- mongodb/: MongoDB database dump
- app-files.tar.gz: Application source code and uploads
- config/: Configuration files
EOF
    
    success "Backup created at: $backup_path"
}

# Restore from backup
restore_data() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup not found: $backup_name"
    fi
    
    log "Restoring from backup: $backup_name"
    
    # Stop services
    if command_exists pm2; then
        pm2 stop all || true
    elif command_exists docker-compose; then
        docker-compose down || true
    else
        sudo systemctl stop zeduno || true
    fi
    
    # Restore MongoDB
    if [[ -d "$backup_path/mongodb" ]]; then
        log "Restoring MongoDB..."
        mongorestore --uri="mongodb://localhost:27017/zeduno" --drop "$backup_path/mongodb/zeduno/"
    fi
    
    # Restore application files
    local app_dir="/opt/zeduno"
    if [[ ! -d "$app_dir" ]]; then
        app_dir="$HOME/zeduno"
    fi
    
    if [[ -f "$backup_path/app-files.tar.gz" ]]; then
        log "Restoring application files..."
        tar -xzf "$backup_path/app-files.tar.gz" -C "$app_dir"
    fi
    
    # Restore configuration
    if [[ -d "$backup_path/config" ]]; then
        log "Restoring configuration files..."
        
        # Nginx
        if [[ -f "$backup_path/config/zeduno" ]]; then
            sudo cp "$backup_path/config/zeduno" /etc/nginx/sites-available/
        fi
        
        # Environment
        if [[ -f "$backup_path/config/.env" ]]; then
            cp "$backup_path/config/.env" "$app_dir/backend/"
        fi
    fi
    
    # Rebuild and restart
    cd "$app_dir"
    npm install
    cd backend && npm install && cd ..
    npm run build
    
    # Start services
    if command_exists pm2; then
        pm2 start all
    elif [[ -f "docker-compose.prod.yml" ]]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        sudo systemctl start zeduno
    fi
    
    success "Restore completed from backup: $backup_name"
}

# List available backups
list_backups() {
    log "Available backups:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        info "No backups found. Backup directory does not exist."
        return
    fi
    
    local count=0
    for backup in "$BACKUP_DIR"/*; do
        if [[ -d "$backup" ]]; then
            local name=$(basename "$backup")
            local date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S')
            local size=$(du -sh "$backup" 2>/dev/null | cut -f1)
            echo -e "  ${CYAN}$name${NC} - $date (${size})"
            ((count++))
        fi
    done
    
    if [[ $count -eq 0 ]]; then
        info "No backups found."
    else
        info "Total: $count backups"
    fi
}

# Show system status
show_status() {
    log "ZedUno System Status"
    echo
    
    # Service status
    info "Service Status:"
    if command_exists pm2; then
        pm2 list 2>/dev/null || echo "PM2 not running"
    elif command_exists docker-compose; then
        docker-compose ps 2>/dev/null || echo "Docker services not running"
    else
        systemctl status zeduno --no-pager -l 2>/dev/null || echo "System service not running"
    fi
    
    echo
    
    # Database status
    info "Database Status:"
    if command_exists mongosh; then
        mongosh --eval "db.runCommand('ping')" --quiet 2>/dev/null && echo "MongoDB: Running" || echo "MongoDB: Not accessible"
    else
        echo "MongoDB client not installed"
    fi
    
    echo
    
    # System resources
    info "System Resources:"
    echo "Memory: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB (%.2f%%)\n", $3/1024/1024, $2/1024/1024, $3*100/$2}')"
    echo "Disk: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
    echo "Load: $(uptime | awk -F'load average:' '{ print $2 }' | xargs)"
    
    echo
    
    # Application health
    info "Application Health:"
    if curl -f -s http://localhost/health >/dev/null; then
        echo -e "${GREEN}Application: Healthy${NC}"
    else
        echo -e "${RED}Application: Unhealthy${NC}"
    fi
}

# Show usage information
show_usage() {
    cat << EOF
ZedUno Deployment Script

Usage: $0 [OPTION]

Options:
    quick       Quick development setup
    prod        Full production deployment
    docker      Docker-based deployment
    update      Update existing installation
    backup      Create backup of data and configuration
    restore     Restore from backup
    list        List available backups
    status      Show system status
    logs        Show application logs
    help        Show this help message

Examples:
    $0 quick                    # Quick development setup
    $0 prod                     # Production deployment
    $0 docker                   # Docker deployment
    $0 backup                   # Create backup
    $0 restore backup-20241201  # Restore specific backup
    $0 status                   # Show system status

For more information, visit: https://github.com/githuax/dine-serve-hub
EOF
}

# Show logs
show_logs() {
    local service="${1:-all}"
    
    case "$service" in
        "pm2"|"all")
            if command_exists pm2; then
                pm2 logs
            fi
            ;;
        "docker")
            if command_exists docker-compose; then
                docker-compose logs -f
            fi
            ;;
        "system")
            sudo journalctl -u zeduno -f
            ;;
        "nginx")
            sudo tail -f /var/log/nginx/access.log
            ;;
        *)
            echo "Available log sources: pm2, docker, system, nginx"
            ;;
    esac
}

# Main function
main() {
    local action="${1:-help}"
    
    # Create log directory
    sudo mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    # Show header
    echo -e "${PURPLE}"
    echo "============================================="
    echo "         ZedUno Deployment Script           "
    echo "============================================="
    echo -e "${NC}"
    
    case "$action" in
        "quick")
            check_system
            quick_setup
            ;;
        "prod"|"production")
            check_system
            production_setup
            ;;
        "docker")
            check_system
            docker_setup
            ;;
        "update")
            update_deployment
            ;;
        "backup")
            backup_data "$2"
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                error "Please specify backup name. Use 'list' to see available backups."
            fi
            restore_data "$2"
            ;;
        "list")
            list_backups
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-all}"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            error "Unknown option: $action. Use 'help' for usage information."
            ;;
    esac
}

# Run main function with all arguments
main "$@"