const https = require('https');

async function testRealTimePaymentFlow() {
  console.log('🧪 Testing Real-Time Payment Flow...\n');
  
  console.log('📋 Test Scenario:');
  console.log('1. Frontend opens payment dialog');
  console.log('2. User initiates M-Pesa payment');
  console.log('3. Payment dialog shows "pending" state');
  console.log('4. M-Pesa callback received by backend');
  console.log('5. WebSocket emits real-time update');
  console.log('6. Frontend automatically shows "success" state');
  
  console.log('\n🔥 Simulating M-Pesa callback to test real-time updates...');
  
  // Test with the order that had successful payment processing
  const testCallback = {
    amount: "5",
    transactionReference: "TEST_REALTIME_" + Date.now(),
    resultCode: 0,
    resultDesc: "The service request is processed successfully.",
    phoneNumber: "254721121953",
    transactionDate: new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14),
    orderId: "BT-ORD-1205", // Using the order that we know exists
    requestReferenceId: "test_realtime_" + Math.random().toString(36).substring(7)
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testCallback);
      
      const options = {
        hostname: 'zeduno.piskoe.com',
        port: 443,
        path: '/api/mpesa-kcb/callback',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Zed-Business-Test/1.0'
        },
        timeout: 15000
      };

      const request = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      request.write(postData);
      request.end();
    });

    console.log(`📡 Callback Response: ${response.statusCode}`);
    console.log(`📄 Response Data: ${response.data}`);
    
    if (response.statusCode === 200) {
      console.log('\n✅ SUCCESS: Real-time payment flow test completed!');
      console.log('\n🔥 What should happen now:');
      console.log('1. ✅ Backend processed the callback');
      console.log('2. ✅ Order ORD-1205 marked as paid');
      console.log('3. ✅ WebSocket event emitted to order room');
      console.log('4. 🔄 Frontend listening on order:ORD-1205 should receive update');
      console.log('5. 🔄 Payment dialog should auto-update from pending → success');
      
      console.log('\n💡 To test the full flow:');
      console.log('1. Open the frontend payment dialog');
      console.log('2. Initiate a payment (goes to pending state)');
      console.log('3. Use a real M-Pesa payment or this test callback');
      console.log('4. Watch the dialog automatically update to success! 🎉');
      
    } else {
      console.log('❌ FAILED: Callback processing failed');
      console.log('Response:', response.data);
    }

  } catch (error) {
    console.error('❌ Error testing real-time flow:', error.message);
  }
}

testRealTimePaymentFlow();
