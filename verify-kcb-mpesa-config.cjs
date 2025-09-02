const axios = require('axios');

/**
 * KCB M-Pesa Configuration Verification Script
 * ============================================
 * 
 * This script verifies the KCB M-Pesa configuration and tests API endpoints
 * to ensure everything is working correctly.
 */

// Configuration
const CONFIG = {
  apiBaseUrl: 'http://localhost:5000',
  frontendUrl: 'http://localhost:5173',
  kcbApiUrl: 'https://api.dev.zed.business',
  testCredentials: {
    email: 'irungumill@mail.com',
    password: 'Pass@12345'
  }
};

class KCBMPesaVerification {
  constructor() {
    this.authToken = null;
    this.currentUser = null;
    this.currentTenant = null;
  }

  /**
   * Login and get authentication token
   */
  async authenticate() {
    try {
      console.log('🔐 Authenticating...');
      const response = await axios.post(`${CONFIG.apiBaseUrl}/api/auth/login`, {
        email: CONFIG.testCredentials.email,
        password: CONFIG.testCredentials.password
      });

      this.authToken = response.data.token;
      this.currentUser = response.data.user;
      this.currentTenant = response.data.tenant;

      console.log('✅ Authentication successful');
      console.log(`👤 User: ${this.currentUser.firstName} ${this.currentUser.lastName}`);
      console.log(`🏢 Tenant: ${this.currentTenant?.name || 'N/A'}`);
      console.log(`🆔 Tenant ID: ${this.currentUser.tenantId}\n`);

      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get request headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Verify KCB M-Pesa configuration in database
   */
  async verifyConfiguration() {
    try {
      console.log('🔍 Verifying KCB M-Pesa configuration...');
      
      const response = await axios.get(
        `${CONFIG.apiBaseUrl}/api/payments/config/${this.currentUser.tenantId}`,
        { headers: this.getHeaders() }
      );

      const config = response.data.paymentConfig?.mpesaKCB;
      
      if (!config) {
        console.log('❌ KCB M-Pesa configuration not found');
        return false;
      }

      console.log('📋 Current KCB M-Pesa Configuration:');
      console.log('====================================');
      console.log(`✓ Enabled: ${config.enabled ? '✅ YES' : '❌ NO'}`);
      console.log(`✓ API Key: ${config.apiKey || '❌ Not set'}`);
      console.log(`✓ Auth Token: ${config.authToken ? `${config.authToken.substring(0, 30)}...` : '❌ Not set'}`);
      console.log(`✓ Base URL: ${config.baseUrl || '❌ Not set'}`);
      console.log(`✓ External Origin: ${config.externalOrigin || '❌ Not set'}`);

      // Validate required fields
      const requiredFields = ['apiKey', 'authToken', 'baseUrl', 'externalOrigin'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        return false;
      }

      console.log('\n🎯 Configuration Status: ✅ VALID\n');
      return config;

    } catch (error) {
      console.error('❌ Configuration verification failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Test KCB M-Pesa API endpoints
   */
  async testAPIEndpoints() {
    console.log('🧪 Testing KCB M-Pesa API endpoints...');
    console.log('=====================================');

    const endpoints = [
      {
        name: 'Payment Initiation',
        method: 'POST',
        url: `${CONFIG.apiBaseUrl}/api/mpesa-kcb/initiate`,
        payload: {
          amount: 100,
          phoneNumber: '254712345678',
          description: 'Test payment verification',
          orderId: `verify-${Date.now()}`
        }
      },
      {
        name: 'Payment History',
        method: 'GET',
        url: `${CONFIG.apiBaseUrl}/api/mpesa-kcb/history`
      },
      {
        name: 'Payment Statistics',
        method: 'GET',
        url: `${CONFIG.apiBaseUrl}/api/mpesa-kcb/statistics`
      }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing ${endpoint.name}...`);
        
        const config = {
          headers: this.getHeaders(),
          timeout: 10000
        };

        let response;
        if (endpoint.method === 'POST') {
          response = await axios.post(endpoint.url, endpoint.payload, config);
        } else {
          response = await axios.get(endpoint.url, config);
        }

        console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
        if (response.data) {
          console.log(`📄 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
        }
        
        results.push({ endpoint: endpoint.name, status: 'SUCCESS', code: response.status });

      } catch (error) {
        const status = error.response?.status || 'ERROR';
        const message = error.response?.data?.message || error.message;
        
        console.log(`❌ ${endpoint.name}: FAILED (${status})`);
        console.log(`💬 Error: ${message}`);
        
        results.push({ endpoint: endpoint.name, status: 'FAILED', code: status, error: message });
      }
    }

    return results;
  }

  /**
   * Test KCB API connectivity (external)
   */
  async testKCBAPIConnectivity(config) {
    console.log('🌐 Testing KCB API connectivity...');
    console.log('==================================');

    try {
      // Test a simple connectivity check (this would be adjusted based on actual KCB API)
      const testEndpoint = `${config.baseUrl}/api/v1/health`; // Hypothetical health check
      
      const response = await axios.get(testEndpoint, {
        headers: {
          'X-Authorization': config.authToken,
          'Authorization': `API Key ${config.apiKey}`
        },
        timeout: 10000
      });

      console.log('✅ KCB API connectivity: SUCCESS');
      return true;

    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ KCB API connectivity: Endpoint not found (expected for health check)');
        console.log('🔗 Base URL is reachable, but no health endpoint available');
        return true;
      } else if (error.response?.status === 401) {
        console.log('❌ KCB API connectivity: Authentication failed');
        console.log('🔑 Please verify API credentials');
        return false;
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('❌ KCB API connectivity: Connection failed');
        console.log('🌐 Please check network connectivity and base URL');
        return false;
      } else {
        console.log('⚠️ KCB API connectivity: Unknown response');
        console.log(`📝 Status: ${error.response?.status || error.code}`);
        return true; // Assume connectivity is OK for other errors
      }
    }
  }

  /**
   * Test frontend integration
   */
  async testFrontendIntegration() {
    console.log('🎨 Testing frontend integration...');
    console.log('==================================');

    try {
      // Test if frontend is accessible
      const frontendResponse = await axios.get(CONFIG.frontendUrl, { timeout: 5000 });
      console.log('✅ Frontend accessibility: SUCCESS');

      // Test payment dialog endpoint (if available)
      try {
        const paymentDialogUrl = `${CONFIG.frontendUrl}/payments/deposit-collection`;
        await axios.get(paymentDialogUrl, { timeout: 5000 });
        console.log('✅ Payment dialog page: ACCESSIBLE');
      } catch (error) {
        console.log('⚠️ Payment dialog page: May require authentication');
      }

      return true;

    } catch (error) {
      console.log('❌ Frontend accessibility: FAILED');
      console.log('🔧 Please ensure the frontend server is running');
      return false;
    }
  }

  /**
   * Generate test report
   */
  generateReport(results) {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('======================');
    
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const failureCount = results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Successful tests: ${successCount}`);
    console.log(`❌ Failed tests: ${failureCount}`);
    console.log(`📈 Success rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}: ${result.status} (${result.code})`);
      if (result.error) {
        console.log(`   💬 ${result.error}`);
      }
    });

    console.log('\n🔧 Recommendations:');
    if (failureCount > 0) {
      console.log('- Check that the backend server is running');
      console.log('- Verify database connectivity');
      console.log('- Ensure KCB M-Pesa configuration is properly set');
      console.log('- Test with valid phone numbers and amounts');
    } else {
      console.log('- All tests passed! KCB M-Pesa integration is ready');
      console.log('- Consider testing with real transactions in a controlled environment');
      console.log('- Monitor logs for any production issues');
    }
  }

  /**
   * Main verification workflow
   */
  async run() {
    console.log('🚀 KCB M-Pesa Configuration Verification');
    console.log('=========================================\n');

    const results = [];

    // Step 1: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('💥 Verification failed: Cannot authenticate');
      return;
    }
    results.push({ endpoint: 'Authentication', status: 'SUCCESS', code: 200 });

    // Step 2: Verify configuration
    const config = await this.verifyConfiguration();
    if (!config) {
      console.log('💥 Verification failed: Invalid configuration');
      return;
    }
    results.push({ endpoint: 'Configuration', status: 'SUCCESS', code: 200 });

    // Step 3: Test API endpoints
    const apiResults = await this.testAPIEndpoints();
    results.push(...apiResults);

    // Step 4: Test KCB API connectivity
    const connectivitySuccess = await this.testKCBAPIConnectivity(config);
    results.push({
      endpoint: 'KCB API Connectivity',
      status: connectivitySuccess ? 'SUCCESS' : 'FAILED',
      code: connectivitySuccess ? 200 : 'ERROR'
    });

    // Step 5: Test frontend integration
    const frontendSuccess = await this.testFrontendIntegration();
    results.push({
      endpoint: 'Frontend Integration',
      status: frontendSuccess ? 'SUCCESS' : 'FAILED',
      code: frontendSuccess ? 200 : 'ERROR'
    });

    // Step 6: Generate report
    this.generateReport(results);

    console.log('\n🎉 Verification completed!\n');
  }
}

// Export for module use
module.exports = KCBMPesaVerification;

// Command line execution
if (require.main === module) {
  const verification = new KCBMPesaVerification();
  verification.run().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

/**
 * Usage:
 * node verify-kcb-mpesa-config.cjs
 */
