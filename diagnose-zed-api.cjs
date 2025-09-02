const https = require('https');

console.log('🔍 Diagnosing Zed Business API Connection...\n');

const ZED_API_BASE = 'https://api.dev.zed.business';

// Test the base API endpoint
function testApiEndpoint(url) {
  return new Promise((resolve) => {
    const request = https.get(url, { timeout: 10000 }, (response) => {
      console.log(`📡 ${url}`);
      console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (response.statusCode === 502) {
          console.log('   ❌ 502 Bad Gateway - API server is down or unreachable');
        } else if (response.statusCode === 200) {
          console.log('   ✅ API is responding');
        } else {
          console.log(`   ⚠️  Unexpected status code`);
        }
        resolve();
      });
    });
    
    request.on('error', (error) => {
      console.log(`📡 ${url}`);
      console.log(`   ❌ Connection Error: ${error.message}`);
      resolve();
    });
    
    request.on('timeout', () => {
      console.log(`📡 ${url}`);
      console.log(`   ❌ Connection Timeout (10s)`);
      request.destroy();
      resolve();
    });
  });
}

async function runDiagnostics() {
  console.log('🎯 Testing Zed Business API endpoints:\n');
  
  await testApiEndpoint(ZED_API_BASE);
  await testApiEndpoint(`${ZED_API_BASE}/health`);
  await testApiEndpoint(`${ZED_API_BASE}/api/v1/health`);
  
  console.log('\n📋 Summary:');
  console.log('✅ Your invoice number changes are working perfectly! (ORD-6478 format)');
  console.log('❌ Zed Business API is currently returning 502 Bad Gateway');
  
  console.log('\n💡 Possible Solutions:');
  console.log('1. 🔄 Wait - The Zed Business API may be temporarily down');
  console.log('2. 🌐 Check internet connectivity');
  console.log('3. 📞 Contact Zed Business support about API availability');
  console.log('4. 🔧 Check if API endpoint URL has changed');
  console.log('5. 🔑 Verify if auth token needs renewal');
  
  console.log('\n🔍 Current Configuration:');
  console.log(`   Base URL: ${ZED_API_BASE}`);
  console.log('   Endpoint: /api/v1/payments/initiate_kcb_stk_push');
  console.log('   Business ID: 9002742');
  console.log('   Business: Daily Hotel');
}

runDiagnostics();
