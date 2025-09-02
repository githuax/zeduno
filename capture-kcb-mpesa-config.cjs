const axios = require('axios');
const mongoose = require('mongoose');

/**
 * KCB M-Pesa Configuration Capture Script
 * =====================================
 * 
 * This script captures and configures KCB M-Pesa payment gateway settings
 * for the HotelZed system with the provided credentials.
 */

// KCB M-Pesa Configuration
const KCB_MPESA_CONFIG = {
  enabled: true,
  apiKey: 'X', // API Key for authorization header
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub2IiOnsidmFsdWUiOjUwLCJzdGF0ZSI6ZmFsc2V9LCJ2b2NiIjpmYWxzZSwidXNlcklkIjoiNjQ5ZDJlMTc2MmFlMjJkZjg2ZjAxNjk3IiwiaWQiOiI2NDlkMmUxNzYyYWUyMmRmODZmMDE2OTciLCJlbWFpbCI6ImtpbWF0aGljaHJpczEzK2RhaWx5aG90ZWxAZ21haWwuY29tIiwidXNlck5hbWUiOiJCcmlhbkdpdGh1YSIsImdyb3VwIjoiTWVyY2hhbnQiLCJiaWQiOiI5MDAyNzQyIiwiYmlkU3RyaW5nIjoiNjhiMTQ4MjM4MDRlNWRmNzA5ZGU2MWM3IiwiY3VzdG9tZXJJZCI6IjY2MjY1ZmYzZDg5Njc1YTk3NTY1ZGRkYSIsImJ1c2luZXNzTmFtZSI6IkRhaWx5IEhvdGVsIiwiYnVzaW5lc3NPd25lclBob25lIjoiKzI1NDU0NTQ1NDU0NCIsImJ1c2luZXNzT3duZXJBZGRyZXNzIjoiTmFpcm9iaSwgS2VueWEiLCJidWxrVGVybWluYWxzIjpbXSwic2Vzc2lvbkV4cGlyeSI6IjIwMjUtMDgtMzBUMDY6MjY6NDUuMjM5WiIsIlRpbGwiOiIiLCJQYXliaWxsIjoiIiwiVm9vbWEiOiIiLCJFcXVpdGVsIjoiIiwic3RvcmVOYW1lIjoibnVsbCIsImxvY2FsQ3VycmVuY3kiOiJLRVMiLCJ4ZXJvQWNjb3VudGluZ0VuYWJsZWQiOiJmYWxzZSIsInF1aWNrYm9va3NBY2NvdW50aW5nRW5hYmxlZCI6ImZhbHNlIiwiem9ob0FjY291bnRpbmdFbmFibGVkIjoiZmFsc2UiLCJpYXQiOjE3NTY0NDg4MDUsImV4cCI6MTc1NjUzNTIwNX0.4LrMoetiZiTSc7HzeCGuAaxnEk1tP7e3F05ccxxxtwc',
  baseUrl: 'https://api.dev.zed.business',
  externalOrigin: '9002742'
};

// API Base URL
const API_BASE_URL = 'http://localhost:5000';

// Default tenant credentials for testing
const DEFAULT_CREDENTIALS = {
  email: 'irungumill@mail.com',
  password: 'Pass@12345'
};

class KCBMPesaConfigCapture {
  constructor() {
    this.authToken = null;
    this.currentUser = null;
    this.currentTenant = null;
  }

  /**
   * Login and get authentication token
   */
  async login(email = DEFAULT_CREDENTIALS.email, password = DEFAULT_CREDENTIALS.password) {
    try {
      console.log('🔐 Authenticating...');
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      this.authToken = response.data.token;
      this.currentUser = response.data.user;
      this.currentTenant = response.data.tenant;

      console.log('✅ Authentication successful');
      console.log(`👤 User: ${this.currentUser.firstName} ${this.currentUser.lastName}`);
      console.log(`🏢 Tenant: ${this.currentTenant?.name || 'N/A'}`);
      console.log(`🆔 Tenant ID: ${this.currentUser.tenantId || 'N/A'}\n`);

      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get request headers for authenticated requests
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Configure KCB M-Pesa settings for a tenant
   */
  async configureKCBMPesa(tenantId = null) {
    const targetTenantId = tenantId || this.currentUser.tenantId;
    
    if (!targetTenantId) {
      console.error('❌ No tenant ID available');
      return false;
    }

    try {
      console.log('🔧 Configuring KCB M-Pesa settings...');
      
      // First get current configuration
      let currentConfig = {};
      try {
        const configResponse = await axios.get(`${API_BASE_URL}/api/payments/config/${targetTenantId}`, {
          headers: this.getHeaders()
        });
        currentConfig = configResponse.data.paymentConfig || {};
      } catch (error) {
        console.log('⚠️ No existing config found, creating new one');
      }

      // Update with KCB M-Pesa configuration
      const updatedConfig = {
        paymentConfig: {
          ...currentConfig,
          mpesaKCB: {
            ...KCB_MPESA_CONFIG
          }
        }
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/payments/config/${targetTenantId}`,
        updatedConfig,
        { headers: this.getHeaders() }
      );

      console.log('✅ KCB M-Pesa configuration saved successfully\n');
      return true;

    } catch (error) {
      console.error('❌ Failed to configure KCB M-Pesa:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verify KCB M-Pesa configuration
   */
  async verifyConfiguration(tenantId = null) {
    const targetTenantId = tenantId || this.currentUser.tenantId;
    
    try {
      console.log('🔍 Verifying KCB M-Pesa configuration...');
      
      const response = await axios.get(`${API_BASE_URL}/api/payments/config/${targetTenantId}`, {
        headers: this.getHeaders()
      });

      const mpesaKCBConfig = response.data.paymentConfig?.mpesaKCB;
      
      if (!mpesaKCBConfig) {
        console.log('❌ KCB M-Pesa configuration not found');
        return false;
      }

      console.log('📋 KCB M-Pesa Configuration:');
      console.log('================================');
      console.log(`✓ Enabled: ${mpesaKCBConfig.enabled ? '✅ YES' : '❌ NO'}`);
      console.log(`✓ API Key: ${mpesaKCBConfig.apiKey ? `${mpesaKCBConfig.apiKey}` : '❌ Not set'}`);
      console.log(`✓ Auth Token: ${mpesaKCBConfig.authToken ? `${mpesaKCBConfig.authToken.substring(0, 50)}...` : '❌ Not set'}`);
      console.log(`✓ Base URL: ${mpesaKCBConfig.baseUrl || '❌ Not set'}`);
      console.log(`✓ External Origin: ${mpesaKCBConfig.externalOrigin || '❌ Not set'}`);
      
      // Validate configuration
      const isValid = this.validateConfiguration(mpesaKCBConfig);
      console.log(`\n🎯 Configuration Status: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
      
      return isValid;

    } catch (error) {
      console.error('❌ Failed to verify configuration:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Validate KCB M-Pesa configuration
   */
  validateConfiguration(config) {
    if (!config.enabled) {
      console.log('⚠️ KCB M-Pesa is disabled');
      return false;
    }

    const requiredFields = ['apiKey', 'authToken', 'baseUrl', 'externalOrigin'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!config[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Test KCB M-Pesa payment initiation (dry run)
   */
  async testPaymentInitiation(tenantId = null) {
    const targetTenantId = tenantId || this.currentUser.tenantId;
    
    try {
      console.log('🧪 Testing KCB M-Pesa payment initiation...');
      
      const testPaymentData = {
        amount: 100, // KES 100
        phoneNumber: '254712345678', // Test phone number
        description: 'Test payment - KCB M-Pesa configuration',
        orderId: `test-${Date.now()}`
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mpesa-kcb/initiate`,
        testPaymentData,
        { headers: this.getHeaders() }
      );

      console.log('✅ Payment initiation test successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;

    } catch (error) {
      console.log('⚠️ Payment initiation test failed (expected for test credentials):');
      console.log(error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Direct database update (alternative method)
   */
  async updateTenantDirectly(tenantId) {
    try {
      console.log('🔄 Updating tenant configuration directly...');
      
      await mongoose.connect('mongodb://localhost:27017/zeduno');
      
      const result = await mongoose.connection.db.collection('tenants').updateOne(
        { _id: new mongoose.Types.ObjectId(tenantId) },
        {
          $set: {
            'paymentConfig.mpesaKCB': KCB_MPESA_CONFIG
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Direct database update successful');
        return true;
      } else {
        console.log('❌ No tenant found or already up to date');
        return false;
      }

    } catch (error) {
      console.error('❌ Direct database update failed:', error);
      return false;
    } finally {
      await mongoose.connection.close();
    }
  }

  /**
   * Display configuration summary
   */
  displayConfigSummary() {
    console.log('📊 KCB M-Pesa Configuration Summary');
    console.log('====================================');
    console.log(`🔑 API Key: ${KCB_MPESA_CONFIG.apiKey}`);
    console.log(`🎫 Auth Token: ${KCB_MPESA_CONFIG.authToken.substring(0, 50)}...`);
    console.log(`🌐 Base URL: ${KCB_MPESA_CONFIG.baseUrl}`);
    console.log(`🏢 External Origin: ${KCB_MPESA_CONFIG.externalOrigin}`);
    console.log(`✅ Enabled: ${KCB_MPESA_CONFIG.enabled}`);
    console.log('');
  }

  /**
   * Main execution method
   */
  async run(options = {}) {
    const {
      email = DEFAULT_CREDENTIALS.email,
      password = DEFAULT_CREDENTIALS.password,
      tenantId = null,
      directDbUpdate = false,
      testPayment = false
    } = options;

    console.log('🚀 KCB M-Pesa Configuration Capture Script');
    console.log('==========================================\n');

    this.displayConfigSummary();

    // Step 1: Authenticate
    const loginSuccess = await this.login(email, password);
    if (!loginSuccess) {
      return;
    }

    // Step 2: Configure KCB M-Pesa
    let configSuccess = false;
    if (directDbUpdate && tenantId) {
      configSuccess = await this.updateTenantDirectly(tenantId);
    } else {
      configSuccess = await this.configureKCBMPesa(tenantId);
    }

    if (!configSuccess) {
      console.log('❌ Configuration failed');
      return;
    }

    // Step 3: Verify configuration
    const verifySuccess = await this.verifyConfiguration(tenantId);
    if (!verifySuccess) {
      console.log('❌ Configuration verification failed');
      return;
    }

    // Step 4: Test payment initiation (optional)
    if (testPayment) {
      await this.testPaymentInitiation(tenantId);
    }

    console.log('🎉 KCB M-Pesa configuration capture completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the payment flow in your application');
    console.log('2. Monitor payment transactions');
    console.log('3. Check callback handling');
    console.log('4. Verify settlement processes\n');
  }
}

// Export for module use
module.exports = KCBMPesaConfigCapture;

// Command line execution
if (require.main === module) {
  const configCapture = new KCBMPesaConfigCapture();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'directDbUpdate' || key === 'testPayment') {
      options[key] = value === 'true';
    } else {
      options[key] = value;
    }
  }

  configCapture.run(options).catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}

/**
 * Usage Examples:
 * 
 * 1. Basic configuration:
 *    node capture-kcb-mpesa-config.cjs
 * 
 * 2. Custom credentials:
 *    node capture-kcb-mpesa-config.cjs --email "user@example.com" --password "password"
 * 
 * 3. Direct database update:
 *    node capture-kcb-mpesa-config.cjs --tenantId "507f1f77bcf86cd799439011" --directDbUpdate true
 * 
 * 4. With payment testing:
 *    node capture-kcb-mpesa-config.cjs --testPayment true
 */
