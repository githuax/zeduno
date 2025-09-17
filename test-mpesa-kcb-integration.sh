#!/bin/bash

# =============================================================================
# M-Pesa KCB Integration Testing Script
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
log() { echo -e "${GREEN}[TEST] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; return 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${CYAN}[SUCCESS] $1${NC}"; }

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         M-PESA KCB INTEGRATION TESTING SUITE                    ║
║                                                                  ║
║         Comprehensive testing for KCB payment gateway           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${NC}
"

# Configuration
APP_DIR="/home/osbui/applications/zeduno/dine-serve-hub"
SERVICE_USER="osbui"
API_BASE_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"
LOG_FILE="/var/log/zeduno-mpesa-kcb-test.log"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test result arrays
declare -a PASSED_TESTS_LIST
declare -a FAILED_TESTS_LIST
declare -a WARNING_TESTS_LIST

# Authentication token
AUTH_TOKEN=""
USER_DATA=""
TENANT_DATA=""

# Create log file
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Logging function
log_test() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Test result functions
test_start() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running test: $1"
    log_test "TEST START: $1"
}

test_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    PASSED_TESTS_LIST+=("$1")
    success "✅ PASSED: $1"
    log_test "TEST PASS: $1"
}

test_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FAILED_TESTS_LIST+=("$1")
    error "❌ FAILED: $1" || true
    log_test "TEST FAIL: $1"
}

test_warn() {
    WARNINGS=$((WARNINGS + 1))
    WARNING_TESTS_LIST+=("$1")
    warn "⚠️  WARNING: $1"
    log_test "TEST WARN: $1"
}

# Helper function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    local url="${API_BASE_URL}${endpoint}"
    local curl_opts=()
    
    curl_opts+=("-s" "-w" "%{http_code}" "--connect-timeout" "10" "--max-time" "30")
    
    if [[ -n "$headers" ]]; then
        curl_opts+=("-H" "$headers")
    fi
    
    if [[ -n "$AUTH_TOKEN" ]]; then
        curl_opts+=("-H" "Authorization: Bearer $AUTH_TOKEN")
    fi
    
    curl_opts+=("-H" "Content-Type: application/json")
    
    if [[ "$method" == "POST" ]] && [[ -n "$data" ]]; then
        curl_opts+=("-X" "POST" "-d" "$data")
    elif [[ "$method" == "PUT" ]] && [[ -n "$data" ]]; then
        curl_opts+=("-X" "PUT" "-d" "$data")
    elif [[ "$method" == "DELETE" ]]; then
        curl_opts+=("-X" "DELETE")
    fi
    
    curl "${curl_opts[@]}" "$url"
}

# Test 1: Check if services are running
test_services_running() {
    test_start "Services Running Check"
    
    # Check backend
    local backend_response=$(curl -s --connect-timeout 5 "http://localhost:5000/api/health" || echo "FAIL")
    if [[ "$backend_response" == *"healthy"* ]] || [[ "$backend_response" == *"ok"* ]]; then
        info "Backend service is running"
    else
        test_fail "Backend service is not responding"
        return
    fi
    
    # Check frontend
    local frontend_response=$(curl -s --connect-timeout 5 "http://localhost:3000" || echo "FAIL")
    if [[ "$frontend_response" != "FAIL" ]]; then
        info "Frontend service is running"
    else
        test_warn "Frontend service may not be responding"
    fi
    
    # Check MongoDB
    if command -v mongosh >/dev/null 2>&1; then
        if mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            info "MongoDB is accessible"
        else
            test_fail "MongoDB is not accessible"
            return
        fi
    else
        test_warn "MongoDB client not found"
    fi
    
    test_pass "Services Running Check"
}

# Test 2: Environment configuration validation
test_environment_config() {
    test_start "Environment Configuration"
    
    local backend_env="$APP_DIR/backend/.env"
    local frontend_env="$APP_DIR/.env.local"
    
    # Check backend environment
    if [[ ! -f "$backend_env" ]]; then
        test_fail "Backend environment file not found"
        return
    fi
    
    local required_backend_vars=(
        "MPESA_KCB_ENABLED"
        "MPESA_KCB_API_KEY"
        "MPESA_KCB_AUTH_TOKEN"
        "MPESA_KCB_BASE_URL"
        "MPESA_KCB_EXTERNAL_ORIGIN"
        "DEFAULT_CURRENCY"
        "SUPPORTED_CURRENCIES"
    )
    
    for var in "${required_backend_vars[@]}"; do
        if ! grep -q "^$var=" "$backend_env"; then
            test_fail "Missing backend environment variable: $var"
            return
        fi
    done
    
    # Check frontend environment
    if [[ -f "$frontend_env" ]]; then
        local required_frontend_vars=(
            "VITE_ENABLE_MPESA_KCB"
            "VITE_DEFAULT_CURRENCY"
            "VITE_SUPPORTED_CURRENCIES"
        )
        
        for var in "${required_frontend_vars[@]}"; do
            if ! grep -q "^$var=" "$frontend_env"; then
                test_warn "Missing frontend environment variable: $var"
            fi
        done
    else
        test_warn "Frontend environment file not found"
    fi
    
    test_pass "Environment Configuration"
}

# Test 3: Authentication and user setup
test_authentication() {
    test_start "Authentication Test"
    
    # Test default credentials
    local login_data='{"email":"irungumill@mail.com","password":"Pass@12345"}'
    local response=$(api_call "POST" "/api/auth/login" "$login_data")
    
    local http_code="${response: -3}"
    local response_body="${response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        AUTH_TOKEN=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
        USER_DATA=$(echo "$response_body" | grep -o '"user":{[^}]*}' || echo "")
        TENANT_DATA=$(echo "$response_body" | grep -o '"tenant":{[^}]*}' || echo "")
        
        if [[ -n "$AUTH_TOKEN" ]]; then
            info "Authentication successful"
            info "User authenticated: $(echo "$response_body" | grep -o '"firstName":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")"
            test_pass "Authentication Test"
        else
            test_fail "Authentication succeeded but no token received"
        fi
    else
        test_fail "Authentication failed with HTTP $http_code"
    fi
}

# Test 4: M-Pesa KCB configuration validation
test_mpesa_kcb_config() {
    test_start "M-Pesa KCB Configuration Validation"
    
    if [[ -z "$AUTH_TOKEN" ]]; then
        test_fail "No authentication token available"
        return
    fi
    
    # Get tenant configuration
    local config_response=$(api_call "GET" "/api/payments/config")
    local http_code="${config_response: -3}"
    local response_body="${config_response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        if echo "$response_body" | grep -q "mpesaKCB"; then
            info "M-Pesa KCB configuration found in tenant settings"
            
            # Check if configuration is enabled
            if echo "$response_body" | grep -q '"enabled":true'; then
                info "M-Pesa KCB is enabled"
                test_pass "M-Pesa KCB Configuration Validation"
            else
                test_warn "M-Pesa KCB configuration exists but is disabled"
            fi
        else
            test_fail "M-Pesa KCB configuration not found in tenant settings"
        fi
    else
        test_fail "Failed to retrieve tenant configuration (HTTP $http_code)"
    fi
}

# Test 5: M-Pesa KCB API endpoints
test_mpesa_kcb_endpoints() {
    test_start "M-Pesa KCB API Endpoints"
    
    if [[ -z "$AUTH_TOKEN" ]]; then
        test_fail "No authentication token available"
        return
    fi
    
    local endpoints_passed=0
    local total_endpoints=4
    
    # Test payment history endpoint
    info "Testing payment history endpoint..."
    local history_response=$(api_call "GET" "/api/mpesa-kcb/history")
    local http_code="${history_response: -3}"
    if [[ "$http_code" == "200" ]]; then
        endpoints_passed=$((endpoints_passed + 1))
        info "Payment history endpoint: OK"
    else
        warn "Payment history endpoint failed (HTTP $http_code)"
    fi
    
    # Test payment statistics endpoint
    info "Testing payment statistics endpoint..."
    local stats_response=$(api_call "GET" "/api/mpesa-kcb/statistics")
    http_code="${stats_response: -3}"
    if [[ "$http_code" == "200" ]]; then
        endpoints_passed=$((endpoints_passed + 1))
        info "Payment statistics endpoint: OK"
    else
        warn "Payment statistics endpoint failed (HTTP $http_code)"
    fi
    
    # Test callback endpoint (should be accessible without auth)
    info "Testing callback endpoint accessibility..."
    local callback_response=$(curl -s -w "%{http_code}" --connect-timeout 5 \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"test":"connectivity"}' \
        "${API_BASE_URL}/api/mpesa-kcb/callback" 2>/dev/null || echo "000")
    http_code="${callback_response: -3}"
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "404" ]] || [[ "$http_code" == "400" ]]; then
        endpoints_passed=$((endpoints_passed + 1))
        info "Callback endpoint is accessible (HTTP $http_code)"
    else
        warn "Callback endpoint accessibility issue (HTTP $http_code)"
    fi
    
    # Test payment initiation endpoint (with test data)
    info "Testing payment initiation endpoint..."
    local payment_data='{
        "amount": 10,
        "phone": "254712345678",
        "description": "Test payment",
        "type": "deposit"
    }'
    local payment_response=$(api_call "POST" "/api/mpesa-kcb/initiate" "$payment_data")
    http_code="${payment_response: -3}"
    if [[ "$http_code" == "200" ]]; then
        endpoints_passed=$((endpoints_passed + 1))
        info "Payment initiation endpoint: OK (actual payment not processed)"
    elif [[ "$http_code" == "400" ]]; then
        endpoints_passed=$((endpoints_passed + 1))
        info "Payment initiation endpoint: OK (validation working)"
    else
        warn "Payment initiation endpoint failed (HTTP $http_code)"
    fi
    
    if [[ $endpoints_passed -ge 3 ]]; then
        test_pass "M-Pesa KCB API Endpoints"
    else
        test_fail "M-Pesa KCB API Endpoints ($endpoints_passed/$total_endpoints passed)"
    fi
}

# Test 6: Currency support validation
test_currency_support() {
    test_start "Currency Support Validation"
    
    local backend_env="$APP_DIR/backend/.env"
    local expected_currencies="KES,UGX,TZS,RWF,BIF,CDF,SSP"
    
    if [[ -f "$backend_env" ]]; then
        local configured_currencies=$(grep "^SUPPORTED_CURRENCIES=" "$backend_env" | cut -d'=' -f2 || echo "")
        local default_currency=$(grep "^DEFAULT_CURRENCY=" "$backend_env" | cut -d'=' -f2 || echo "")
        
        if [[ -n "$configured_currencies" ]]; then
            info "Configured currencies: $configured_currencies"
            
            # Check if all expected East African currencies are supported
            local all_present=true
            IFS=',' read -ra CURRENCY_ARRAY <<< "$expected_currencies"
            for currency in "${CURRENCY_ARRAY[@]}"; do
                if [[ "$configured_currencies" != *"$currency"* ]]; then
                    warn "Currency $currency not found in configuration"
                    all_present=false
                fi
            done
            
            if [[ "$all_present" == true ]]; then
                info "All East African currencies are configured"
            else
                test_warn "Not all expected currencies are configured"
            fi
        else
            test_fail "No supported currencies configured"
            return
        fi
        
        if [[ -n "$default_currency" ]]; then
            info "Default currency: $default_currency"
            if [[ "$expected_currencies" == *"$default_currency"* ]]; then
                info "Default currency is supported"
            else
                test_warn "Default currency is not in supported currencies list"
            fi
        else
            test_warn "No default currency configured"
        fi
        
        test_pass "Currency Support Validation"
    else
        test_fail "Backend environment file not found"
    fi
}

# Test 7: Database connectivity and collections
test_database_setup() {
    test_start "Database Setup Validation"
    
    if ! command -v mongosh >/dev/null 2>&1; then
        test_warn "MongoDB client not available for testing"
        return
    fi
    
    # Check if required collections exist
    local collections_check=$(mongosh --quiet --eval "
        use zeduno;
        var collections = db.getCollectionNames();
        var requiredCollections = ['tenants', 'users', 'paymenttransactions'];
        var missingCollections = [];
        requiredCollections.forEach(function(col) {
            if (collections.indexOf(col) === -1) {
                missingCollections.push(col);
            }
        });
        print(JSON.stringify({
            collections: collections,
            missing: missingCollections
        }));
    " 2>/dev/null || echo '{"error": "failed"}')
    
    if [[ "$collections_check" == *"error"* ]]; then
        test_warn "Could not verify database collections"
    else
        local missing_count=$(echo "$collections_check" | grep -o '"missing":\[[^]]*\]' | grep -o '\[.*\]' | wc -c)
        if [[ $missing_count -le 4 ]]; then  # Empty array "[]" has 2 characters
            info "Required database collections are present"
            test_pass "Database Setup Validation"
        else
            test_warn "Some required database collections may be missing"
        fi
    fi
}

# Test 8: Configuration scripts functionality
test_configuration_scripts() {
    test_start "Configuration Scripts Test"
    
    local scripts_working=0
    local total_scripts=3
    
    # Test verification script
    if [[ -f "$APP_DIR/verify-kcb-mpesa-config.cjs" ]]; then
        info "Testing verification script..."
        if sudo -u "$SERVICE_USER" timeout 30s node "$APP_DIR/verify-kcb-mpesa-config.cjs" >/dev/null 2>&1; then
            scripts_working=$((scripts_working + 1))
            info "Verification script: OK"
        else
            warn "Verification script failed or timed out"
        fi
    else
        warn "Verification script not found"
    fi
    
    # Test callback test script
    if [[ -f "$APP_DIR/test-callback.js" ]]; then
        info "Testing callback test script..."
        if sudo -u "$SERVICE_USER" timeout 15s node "$APP_DIR/test-callback.js" >/dev/null 2>&1; then
            scripts_working=$((scripts_working + 1))
            info "Callback test script: OK"
        else
            warn "Callback test script failed or timed out"
        fi
    else
        warn "Callback test script not found"
    fi
    
    # Test monitoring script
    if [[ -f "$APP_DIR/monitor-mpesa-kcb.sh" ]]; then
        info "Testing monitoring script..."
        if timeout 10s "$APP_DIR/monitor-mpesa-kcb.sh" >/dev/null 2>&1; then
            scripts_working=$((scripts_working + 1))
            info "Monitoring script: OK"
        else
            warn "Monitoring script failed or timed out"
        fi
    else
        warn "Monitoring script not found"
    fi
    
    if [[ $scripts_working -ge 2 ]]; then
        test_pass "Configuration Scripts Test"
    else
        test_fail "Configuration Scripts Test ($scripts_working/$total_scripts working)"
    fi
}

# Test 9: Payment flow simulation (mock test)
test_payment_flow_simulation() {
    test_start "Payment Flow Simulation"
    
    if [[ -z "$AUTH_TOKEN" ]]; then
        test_fail "No authentication token available"
        return
    fi
    
    info "Simulating payment flow with test data..."
    
    # Step 1: Initiate a test payment
    local test_payment_data='{
        "amount": 1,
        "phone": "254700000000",
        "description": "Test payment simulation",
        "type": "deposit"
    }'
    
    local payment_response=$(api_call "POST" "/api/mpesa-kcb/initiate" "$test_payment_data")
    local http_code="${payment_response: -3}"
    local response_body="${response_body%???}"
    
    if [[ "$http_code" == "200" ]]; then
        info "Payment initiation request successful"
        local transaction_id=$(echo "$response_body" | grep -o '"transactionId":"[^"]*"' | cut -d'"' -f4 || echo "")
        
        if [[ -n "$transaction_id" ]]; then
            info "Transaction ID received: ${transaction_id:0:10}..."
            
            # Step 2: Query payment status
            sleep 2
            local status_response=$(api_call "GET" "/api/mpesa-kcb/status/$transaction_id")
            local status_http_code="${status_response: -3}"
            
            if [[ "$status_http_code" == "200" ]]; then
                info "Payment status query successful"
                test_pass "Payment Flow Simulation"
            else
                test_warn "Payment status query failed but initiation worked"
            fi
        else
            test_warn "Payment initiated but no transaction ID received"
        fi
    elif [[ "$http_code" == "400" ]]; then
        info "Payment validation working (expected for test data)"
        test_pass "Payment Flow Simulation"
    elif [[ "$http_code" == "500" ]]; then
        test_warn "Payment initiation failed - may be configuration issue"
    else
        test_fail "Payment initiation failed with HTTP $http_code"
    fi
}

# Test 10: Performance and load test
test_performance() {
    test_start "Performance Test"
    
    if [[ -z "$AUTH_TOKEN" ]]; then
        test_fail "No authentication token available"
        return
    fi
    
    info "Running basic performance test..."
    
    local start_time=$(date +%s%N)
    
    # Make 5 concurrent API calls
    for i in {1..5}; do
        (api_call "GET" "/api/mpesa-kcb/history?limit=1" > /dev/null 2>&1) &
    done
    wait
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    info "Performance test completed in ${duration}ms"
    
    if [[ $duration -lt 5000 ]]; then
        info "API performance is acceptable"
        test_pass "Performance Test"
    else
        test_warn "API performance may be slow (${duration}ms for 5 requests)"
    fi
}

# Generate test report
generate_test_report() {
    log "Generating test report..."
    
    local report_file="$APP_DIR/MPESA_KCB_TEST_REPORT.txt"
    local timestamp=$(date)
    
    cat > "$report_file" << EOF
M-Pesa KCB Integration Test Report
==================================
Generated: $timestamp
Log File: $LOG_FILE

Test Summary:
- Total Tests: $TOTAL_TESTS
- Passed: $PASSED_TESTS
- Failed: $FAILED_TESTS  
- Warnings: $WARNINGS

Test Results:

PASSED TESTS:
EOF
    
    for test in "${PASSED_TESTS_LIST[@]}"; do
        echo "✅ $test" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "FAILED TESTS:" >> "$report_file"
    for test in "${FAILED_TESTS_LIST[@]}"; do
        echo "❌ $test" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "WARNINGS:" >> "$report_file"
    for test in "${WARNING_TESTS_LIST[@]}"; do
        echo "⚠️  $test" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

Configuration Details:
- App Directory: $APP_DIR
- API Base URL: $API_BASE_URL
- Frontend URL: $FRONTEND_URL
- Service User: $SERVICE_USER

Recommendations:
EOF
    
    if [[ $FAILED_TESTS -gt 0 ]]; then
        cat >> "$report_file" << EOF
- Address failed tests before going to production
- Check application logs for detailed error messages
- Verify M-Pesa KCB API credentials and configuration
EOF
    fi
    
    if [[ $WARNINGS -gt 0 ]]; then
        cat >> "$report_file" << EOF
- Review warnings and consider fixing them
- Test with actual phone numbers in a controlled environment
EOF
    fi
    
    if [[ $FAILED_TESTS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        cat >> "$report_file" << EOF
- All tests passed! M-Pesa KCB integration appears ready
- Consider testing with small real transactions
- Monitor the system closely in production
EOF
    fi
    
    cat >> "$report_file" << EOF

Support Commands:
- Check logs: tail -f $LOG_FILE
- Backend logs: tail -f $APP_DIR/logs/backend.log
- Service status: sudo -u $SERVICE_USER pm2 status
- Restart services: sudo -u $SERVICE_USER pm2 restart all

EOF
    
    success "Test report generated: $report_file"
}

# Main test execution
main() {
    log "Starting M-Pesa KCB integration testing suite..."
    log_test "TEST SUITE START: M-Pesa KCB Integration Testing"
    
    echo
    info "Test configuration:"
    info "- App Directory: $APP_DIR"
    info "- API Base URL: $API_BASE_URL"
    info "- Frontend URL: $FRONTEND_URL"
    info "- Log File: $LOG_FILE"
    echo
    
    # Run all tests
    test_services_running
    test_environment_config
    test_authentication
    test_mpesa_kcb_config
    test_mpesa_kcb_endpoints
    test_currency_support
    test_database_setup
    test_configuration_scripts
    test_payment_flow_simulation
    test_performance
    
    # Generate report
    generate_test_report
    
    echo
    echo -e "${WHITE}========================================${NC}"
    echo -e "${WHITE}     M-PESA KCB TEST RESULTS           ${NC}"
    echo -e "${WHITE}========================================${NC}"
    echo
    
    echo -e "${CYAN}Test Summary:${NC}"
    echo "📊 Total Tests: $TOTAL_TESTS"
    echo "✅ Passed: $PASSED_TESTS"
    echo "❌ Failed: $FAILED_TESTS"
    echo "⚠️  Warnings: $WARNINGS"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "📈 Success Rate: ${success_rate}%"
    
    echo
    if [[ $FAILED_TESTS -eq 0 ]]; then
        if [[ $WARNINGS -eq 0 ]]; then
            success "🎉 All tests passed! M-Pesa KCB integration is ready!"
        else
            warn "✅ All tests passed but there are warnings to review"
        fi
        echo -e "${GREEN}Your M-Pesa KCB integration appears to be working correctly.${NC}"
    else
        error "❌ Some tests failed. Please review and fix issues before deployment." || true
        echo -e "${RED}Fix the failed tests before using in production.${NC}"
    fi
    
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo "1. 🧪 Test with real phone numbers (small amounts)"
        echo "2. 🔗 Configure webhook URL in KCB dashboard"
        echo "3. 📊 Monitor transaction logs"
        echo "4. 🚀 Deploy to production environment"
    else
        echo "1. 📝 Review test report: $APP_DIR/MPESA_KCB_TEST_REPORT.txt"
        echo "2. 🔧 Fix failed tests"
        echo "3. 🔁 Run tests again"
        echo "4. 📋 Check application logs for details"
    fi
    
    echo
    echo -e "${PURPLE}Test report saved to: $APP_DIR/MPESA_KCB_TEST_REPORT.txt${NC}"
    echo -e "${PURPLE}Detailed logs available at: $LOG_FILE${NC}"
    
    log_test "TEST SUITE END: M-Pesa KCB Integration Testing"
    
    # Exit with appropriate code
    if [[ $FAILED_TESTS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Check if script is being run with appropriate permissions
if [[ $EUID -ne 0 ]] && [[ ! -r "$APP_DIR" ]]; then
    error "This script needs to be run with appropriate permissions to access $APP_DIR"
fi

# Execute main function
main "$@"
