const fetch = require('node-fetch');
const fs = require('fs');

async function testMPesaKCBEndpoint() {
  try {
    // Read token from .env.local
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const tokenMatch = envContent.match(/VITE_AUTH_TOKEN=(.+)/);
    const token = tokenMatch ? tokenMatch[1].trim() : null;
    
    if (!token) {
      console.log('❌ No token found in .env.local');
      return;
    }

    console.log('🧪 Testing M-Pesa KCB endpoint with East African phone numbers...\n');

    const testCases = [
      {
        name: 'Kenya phone number',
        phoneNumber: '+254712345678',
        currency: 'KES',
        expected: true
      },
      {
        name: 'Uganda phone number',
        phoneNumber: '+256712345678',
        currency: 'UGX',
        expected: true
      },
      {
        name: 'Tanzania phone number',
        phoneNumber: '+255612345678',
        currency: 'TZS',
        expected: true
      },
      {
        name: 'Rwanda phone number',
        phoneNumber: '+250712345678',
        currency: 'RWF',
        expected: true
      },
      {
        name: 'Invalid phone number',
        phoneNumber: '+1234567890',
        currency: 'KES',
        expected: false
      }
    ];

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name} (${testCase.phoneNumber})`);
      
      try {
        const response = await fetch('http://192.168.2.43:8080/api/mpesa-kcb/initiate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: 'test-' + Date.now(),
            amount: 100,
            currency: testCase.currency,
            phoneNumber: testCase.phoneNumber,
            customerName: 'Test Customer',
            description: 'Test payment'
          })
        });

        const result = await response.json();
        
        if (testCase.expected && response.ok) {
          console.log(`✅ ${testCase.name}: SUCCESS`);
          console.log(`   Response: ${result.message}`);
        } else if (!testCase.expected && !response.ok) {
          console.log(`✅ ${testCase.name}: CORRECTLY REJECTED`);
          console.log(`   Error: ${result.error}`);
        } else {
          console.log(`❌ ${testCase.name}: UNEXPECTED RESULT`);
          console.log(`   Expected success: ${testCase.expected}, Got success: ${response.ok}`);
          console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: NETWORK ERROR`);
        console.log(`   Error: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMPesaKCBEndpoint();
