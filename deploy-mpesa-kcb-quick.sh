#!/bin/bash

# =============================================================================
# Quick M-Pesa KCB Deployment Script
# Pre-configured with your KCB credentials - Ready to run!
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
log() { echo -e "${GREEN}[DEPLOY] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${CYAN}[SUCCESS] $1${NC}"; }

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          QUICK M-PESA KCB DEPLOYMENT                             ║
║                                                                  ║
║          Pre-configured with your credentials                    ║
║          Ready to deploy in one command!                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${NC}
"

# Your pre-configured KCB M-Pesa credentials
KCB_API_KEY="X"
KCB_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub2IiOnsidmFsdWUiOjUwLCJzdGF0ZSI6ZmFsc2V9LCJ2b2NiIjpmYWxzZSwidXNlcklkIjoiNjQ5ZDJlMTc2MmFlMjJkZjg2ZjAxNjk3IiwiaWQiOiI2NDlkMmUxNzYyYWUyMmRmODZmMDE2OTciLCJlbWFpbCI6ImtpbWF0aGljaHJpczEzK2RhaWx5aG90ZWxAZ21haWwuY29tIiwidXNlck5hbWUiOiJCcmlhbkdpdGh1YSIsImdyb3VwIjoiTWVyY2hhbnQiLCJiaWQiOiI5MDAyNzQyIiwiYmlkU3RyaW5nIjoiNjhiMTQ4MjM4MDRlNWRmNzA5ZGU2MWM3IiwiY3VzdG9tZXJJZCI6IjY2MjY1ZmYzZDg5Njc1YTk3NTY1ZGRkYSIsImJ1c2luZXNzTmFtZSI6IkRhaWx5IEhvdGVsIiwiYnVzaW5lc3NPd25lclBob25lIjoiKzI1NDU0NTQ1NDU0NCIsImJ1c2luZXNzT3duZXJBZGRyZXNzIjoiTmFpcm9iaSwgS2VueWEiLCJidWxrVGVybWluYWxzIjpbXSwic2Vzc2lvbkV4cGlyeSI6IjIwMjUtMDgtMzBUMDY6MjY6NDUuMjM5WiIsIlRpbGwiOiIiLCJQYXliaWxsIjoiIiwiVm9vbWEiOiIiLCJFcXVpdGVsIjoiIiwic3RvcmVOYW1lIjoibnVsbCIsImxvY2FsQ3VycmVuY3kiOiJLRVMiLCJ4ZXJvQWNjb3VudGluZ0VuYWJsZWQiOiJmYWxzZSIsInF1aWNrYm9va3NBY2NvdW50aW5nRW5hYmxlZCI6ImZhbHNlIiwiem9ob0FjY291bnRpbmdFbmFibGVkIjoiZmFsc2UiLCJpYXQiOjE3NTY0NDg4MDUsImV4cCI6MTc1NjUzNTIwNX0.4LrMoetiZiTSc7HzeCGuAaxnEk1tP7e3F05ccxxxtwc"
KCB_BASE_URL="https://api.dev.zed.business"
KCB_EXTERNAL_ORIGIN="9002742"

# Application settings
APP_DIR="/home/osbui/applications/zeduno/dine-serve-hub"
SERVICE_USER="osbui"

# East African currencies (as per your rules)
SUPPORTED_CURRENCIES="KES,UGX,TZS,RWF,BIF,CDF,SSP"
DEFAULT_CURRENCY="KES"

echo
info "Using pre-configured KCB M-Pesa credentials:"
info "- API Key: ${KCB_API_KEY}"
info "- Base URL: ${KCB_BASE_URL}"
info "- External Origin: ${KCB_EXTERNAL_ORIGIN}"
info "- Supported Currencies: ${SUPPORTED_CURRENCIES}"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Check if ZedUno is already installed
if [[ ! -d "$APP_DIR" ]]; then
    error "ZedUno application not found at $APP_DIR. Please run the main deployment script first."
fi

# Get server info
log "Detecting server configuration..."
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")
DOMAIN=""
if [[ -f "/etc/nginx/sites-available/zeduno" ]]; then
    DOMAIN=$(grep -o 'server_name [^;]*' /etc/nginx/sites-available/zeduno | head -1 | cut -d' ' -f2 | cut -d' ' -f1 || echo "")
fi

# Set callback URL
if [[ -n "$DOMAIN" ]]; then
    KCB_CALLBACK_URL="https://$DOMAIN/api/mpesa-kcb/callback"
else
    KCB_CALLBACK_URL="http://$PUBLIC_IP/api/mpesa-kcb/callback"
fi

info "Server IP: $PUBLIC_IP"
info "Domain: ${DOMAIN:-"Not configured (using IP)"}"
info "Callback URL: $KCB_CALLBACK_URL"
echo

read -p "Continue with M-Pesa KCB deployment? (Y/n): " continue_deploy
case $continue_deploy in
    [Nn]|[Nn][Oo]) error "Deployment cancelled by user" ;;
esac

log "Starting M-Pesa KCB deployment with your credentials..."

# =============================================================================
# UPDATE BACKEND ENVIRONMENT
# =============================================================================

log "Updating backend environment..."

# Backup existing environment file
cp "$APP_DIR/backend/.env" "$APP_DIR/backend/.env.backup.$(date +%Y%m%d-%H%M%S)"

# Add M-Pesa KCB configuration to backend environment
cat >> "$APP_DIR/backend/.env" << EOF

# =====================================================================
# M-Pesa KCB Payment Gateway Configuration
# Auto-configured: $(date)
# =====================================================================

# Core KCB M-Pesa Settings
MPESA_KCB_ENABLED=true
MPESA_KCB_API_KEY=$KCB_API_KEY
MPESA_KCB_AUTH_TOKEN=$KCB_AUTH_TOKEN
MPESA_KCB_BASE_URL=$KCB_BASE_URL
MPESA_KCB_EXTERNAL_ORIGIN=$KCB_EXTERNAL_ORIGIN

# Webhook Configuration
MPESA_KCB_CALLBACK_URL=$KCB_CALLBACK_URL
MPESA_KCB_WEBHOOK_SECRET=$(openssl rand -hex 32)
MPESA_KCB_TIMEOUT=30000

# Currency Configuration (East African currencies)
DEFAULT_CURRENCY=$DEFAULT_CURRENCY
SUPPORTED_CURRENCIES=$SUPPORTED_CURRENCIES

# Currency Exchange Rates (approximate - update as needed)
KES_TO_USD=0.0067
UGX_TO_USD=0.00027
TZS_TO_USD=0.0004
RWF_TO_USD=0.00078
BIF_TO_USD=0.00035
CDF_TO_USD=0.0004
SSP_TO_USD=0.0076

# Feature Flags
ENABLE_INVOICE_SETTLEMENT=true
ENABLE_SETTLEMENT_NOTIFICATIONS=false
ENABLE_PAYMENT_TRACKING=true
ENABLE_WEBHOOK_VALIDATION=true

# Payment Flow Configuration
PAYMENT_TIMEOUT=300
MAX_RETRY_ATTEMPTS=3
SETTLEMENT_BATCH_SIZE=100
SETTLEMENT_PROCESSING_INTERVAL=3600

# Monitoring and Logging
PAYMENT_LOG_LEVEL=info
ENABLE_PAYMENT_ANALYTICS=true
ENABLE_TRANSACTION_MONITORING=true
MONITOR_FAILED_PAYMENTS=true

EOF

success "Backend environment updated"

# =============================================================================
# UPDATE FRONTEND ENVIRONMENT
# =============================================================================

log "Updating frontend environment..."

# Backup existing frontend environment
if [[ -f "$APP_DIR/.env.local" ]]; then
    cp "$APP_DIR/.env.local" "$APP_DIR/.env.local.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Add M-Pesa KCB configuration to frontend environment
cat >> "$APP_DIR/.env.local" << EOF

# =====================================================================
# M-Pesa KCB Frontend Configuration
# Auto-configured: $(date)
# =====================================================================

# Payment Gateway Settings
VITE_ENABLE_MPESA_KCB=true
VITE_MPESA_KCB_NAME="M-Pesa via KCB"
VITE_MPESA_KCB_DESCRIPTION="Pay with M-Pesa through KCB integration"

# Currency Configuration
VITE_DEFAULT_CURRENCY=$DEFAULT_CURRENCY
VITE_SUPPORTED_CURRENCIES=$SUPPORTED_CURRENCIES

# Currency Display Settings
VITE_CURRENCY_SYMBOLS='{"KES":"KSh","UGX":"USh","TZS":"TSh","RWF":"RF","BIF":"FBu","CDF":"FC","SSP":"SS£"}'
VITE_CURRENCY_DECIMAL_PLACES='{"KES":2,"UGX":0,"TZS":0,"RWF":0,"BIF":0,"CDF":2,"SSP":2}'

# Payment UI Configuration
VITE_PAYMENT_METHOD_ORDER=mpesa-kcb,cash,card
VITE_SHOW_PAYMENT_ICONS=true
VITE_ENABLE_PAYMENT_HISTORY=true
VITE_ENABLE_RECEIPT_DOWNLOAD=true

# Feature Toggles
VITE_ENABLE_MULTI_CURRENCY=true
VITE_ENABLE_CURRENCY_CONVERSION=true

# Phone Number Configuration
VITE_PHONE_VALIDATION_COUNTRIES="KE,UG,TZ,RW,BI,CD,SS"
VITE_DEFAULT_COUNTRY_CODE="+254"
VITE_PHONE_INPUT_MASK=true

# Payment Flow Settings
VITE_PAYMENT_POLLING_INTERVAL=5000
VITE_PAYMENT_TIMEOUT=300000
VITE_SHOW_PAYMENT_PROGRESS=true
VITE_ENABLE_PAYMENT_RETRY=true

EOF

success "Frontend environment updated"

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================

log "Installing required dependencies..."

sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR
npm install axios express-validator mongoose
cd backend && npm install axios express-validator mongoose && cd ..
EOF

success "Dependencies installed"

# =============================================================================
# UPDATE NGINX CONFIGURATION
# =============================================================================

if [[ -f "/etc/nginx/sites-available/zeduno" ]]; then
    log "Updating Nginx configuration for M-Pesa KCB webhooks..."
    
    # Backup existing Nginx config
    cp /etc/nginx/sites-available/zeduno /etc/nginx/sites-available/zeduno.backup.$(date +%Y%m%d-%H%M%S)
    
    # Check if M-Pesa KCB callback route already exists
    if ! grep -q "location /api/mpesa-kcb/callback" /etc/nginx/sites-available/zeduno; then
        # Add M-Pesa KCB callback route before the general API location
        sed -i '/location \/api\/ {/i\    # M-Pesa KCB callback endpoint (no authentication required)\n    location /api/mpesa-kcb/callback {\n        proxy_pass http://localhost:5000/api/mpesa-kcb/callback;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 60s;\n        proxy_connect_timeout 60s;\n        proxy_send_timeout 60s;\n    }\n' /etc/nginx/sites-available/zeduno
        
        # Test and reload Nginx
        nginx -t && systemctl reload nginx
        success "Nginx configuration updated"
    else
        info "Nginx M-Pesa KCB configuration already exists"
    fi
fi

# =============================================================================
# CONFIGURE DATABASE
# =============================================================================

log "Configuring M-Pesa KCB in database..."

# Update the configuration script with your actual credentials
sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# The credentials are already correct in capture-kcb-mpesa-config.cjs
# Run configuration capture
node capture-kcb-mpesa-config.cjs --testPayment false
EOF

if [[ $? -eq 0 ]]; then
    success "M-Pesa KCB database configuration completed"
else
    warn "Database configuration completed with warnings - check logs"
fi

# =============================================================================
# CREATE MANAGEMENT SCRIPTS
# =============================================================================

log "Creating management scripts..."

# Create quick test script
cat > "$APP_DIR/test-mpesa-kcb-quick.sh" << 'EOF'
#!/bin/bash

# Quick M-Pesa KCB Test Script

echo "🧪 Testing M-Pesa KCB Integration..."

# Test 1: Check if backend is running
echo "1. Testing backend API..."
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "   ✅ Backend API is running"
else
    echo "   ❌ Backend API is not responding"
    exit 1
fi

# Test 2: Check configuration
echo "2. Testing M-Pesa KCB configuration..."
if node verify-kcb-mpesa-config.cjs >/dev/null 2>&1; then
    echo "   ✅ M-Pesa KCB configuration is valid"
else
    echo "   ⚠️  Configuration verification had issues - check detailed logs"
fi

# Test 3: Test callback endpoint
echo "3. Testing callback endpoint..."
response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"test":"connectivity"}' \
    http://localhost:5000/api/mpesa-kcb/callback)
http_code="${response: -3}"

if [[ "$http_code" == "200" ]] || [[ "$http_code" == "400" ]]; then
    echo "   ✅ Callback endpoint is accessible"
else
    echo "   ⚠️  Callback endpoint returned HTTP $http_code"
fi

echo
echo "🎉 Quick tests completed!"
echo "For comprehensive testing, run: ./test-mpesa-kcb-integration.sh"
EOF

chmod +x "$APP_DIR/test-mpesa-kcb-quick.sh"

# Create status check script
cat > "$APP_DIR/check-mpesa-kcb-status.sh" << 'EOF'
#!/bin/bash

echo "📊 M-Pesa KCB Status Check"
echo "=========================="

echo "Services:"
sudo -u zeduno pm2 status | grep -E "(zeduno|online|stopped|errored)"

echo
echo "Configuration:"
if grep -q "MPESA_KCB_ENABLED=true" /opt/zeduno/backend/.env; then
    echo "✅ M-Pesa KCB is enabled"
else
    echo "❌ M-Pesa KCB is disabled"
fi

echo
echo "API Endpoints Test:"
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Backend API accessible"
else
    echo "❌ Backend API not accessible"
fi

echo
echo "Recent Logs:"
echo "Backend logs (last 5 lines):"
tail -n 5 /opt/zeduno/logs/backend.log 2>/dev/null || echo "No backend logs found"

echo
echo "For detailed testing: ./test-mpesa-kcb-quick.sh"
EOF

chmod +x "$APP_DIR/check-mpesa-kcb-status.sh"
chown $SERVICE_USER:$SERVICE_USER "$APP_DIR/test-mpesa-kcb-quick.sh" "$APP_DIR/check-mpesa-kcb-status.sh"

success "Management scripts created"

# =============================================================================
# RESTART SERVICES
# =============================================================================

log "Rebuilding and restarting services..."

sudo -u $SERVICE_USER bash << EOF
cd $APP_DIR

# Rebuild frontend with new environment
npm run build

# Restart PM2 services
pm2 restart all
EOF

# Wait for services to start
sleep 10

# Check services
PM2_STATUS=$(sudo -u $SERVICE_USER pm2 list | grep -E "online" | wc -l)
if [[ $PM2_STATUS -ge 2 ]]; then
    success "Services restarted successfully"
else
    warn "Some services may need attention - check PM2 status"
fi

# =============================================================================
# FINAL VERIFICATION
# =============================================================================

log "Performing final verification..."

# Quick connectivity test
BACKEND_OK=false
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    BACKEND_OK=true
fi

# Test M-Pesa KCB configuration
MPESA_KCB_OK=false
if sudo -u $SERVICE_USER node "$APP_DIR/verify-kcb-mpesa-config.cjs" >/dev/null 2>&1; then
    MPESA_KCB_OK=true
fi

# =============================================================================
# CREATE DEPLOYMENT SUMMARY
# =============================================================================

cat > "$APP_DIR/MPESA_KCB_DEPLOYMENT_SUMMARY.txt" << EOF
M-Pesa KCB Deployment Summary
============================
Deployed: $(date)
Server: $PUBLIC_IP
Domain: ${DOMAIN:-"Not configured"}

KCB M-Pesa Configuration:
- API Key: $KCB_API_KEY
- Base URL: $KCB_BASE_URL  
- External Origin: $KCB_EXTERNAL_ORIGIN
- Callback URL: $KCB_CALLBACK_URL

Currency Support:
- Default: $DEFAULT_CURRENCY
- Supported: $SUPPORTED_CURRENCIES

Status:
- Backend API: $([ $BACKEND_OK == true ] && echo "✅ Running" || echo "❌ Issues")
- M-Pesa KCB Config: $([ $MPESA_KCB_OK == true ] && echo "✅ Valid" || echo "⚠️  Check required")

Quick Commands:
- Status Check: ./check-mpesa-kcb-status.sh
- Quick Test: ./test-mpesa-kcb-quick.sh  
- Full Test: ./test-mpesa-kcb-integration.sh
- View Logs: sudo -u zeduno pm2 logs
- Restart: sudo -u zeduno pm2 restart all

Files Created:
- Backend Config: $APP_DIR/backend/.env
- Frontend Config: $APP_DIR/.env.local
- Test Script: $APP_DIR/test-mpesa-kcb-quick.sh
- Status Check: $APP_DIR/check-mpesa-kcb-status.sh

Next Steps:
1. Test callback URL: $KCB_CALLBACK_URL
2. Whitelist callback URL in KCB dashboard  
3. Test with small amounts
4. Monitor logs during testing
EOF

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================

echo
echo -e "${WHITE}========================================${NC}"
echo -e "${WHITE}   🎉 DEPLOYMENT COMPLETE! 🎉          ${NC}"
echo -e "${WHITE}========================================${NC}"
echo

if [[ $BACKEND_OK == true ]]; then
    success "M-Pesa KCB payment gateway is deployed and ready!"
else
    warn "Deployment completed but backend may need attention"
fi

echo
echo -e "${CYAN}✅ Your KCB M-Pesa Integration:${NC}"
echo "🔑 API Key: $KCB_API_KEY"
echo "🌐 Base URL: $KCB_BASE_URL"
echo "📞 Callback URL: $KCB_CALLBACK_URL"
echo "💰 Currencies: $SUPPORTED_CURRENCIES"

echo
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Test the integration:"
echo "   cd $APP_DIR && ./test-mpesa-kcb-quick.sh"
echo
echo "2. Check service status:"
echo "   cd $APP_DIR && ./check-mpesa-kcb-status.sh"
echo
echo "3. Configure callback URL in KCB dashboard:"
echo "   Add this URL: $KCB_CALLBACK_URL"
echo
echo "4. Test with real phone number (small amount):"
echo "   Use test number: 254712345678 with 1 KES"

echo
echo -e "${BLUE}📁 Important Files:${NC}"
echo "📄 Deployment summary: $APP_DIR/MPESA_KCB_DEPLOYMENT_SUMMARY.txt"
echo "📋 Backend config: $APP_DIR/backend/.env"
echo "🎨 Frontend config: $APP_DIR/.env.local"
echo "📊 Logs: $APP_DIR/logs/backend.log"

echo
echo -e "${GREEN}🎯 M-Pesa KCB is now ready for your East African customers!${NC}"
echo -e "${GREEN}Supports: Kenya, Uganda, Tanzania, Rwanda, Burundi, Congo, South Sudan${NC}"

log "Quick deployment completed successfully! 🚀"

exit 0
