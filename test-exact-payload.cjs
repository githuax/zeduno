const https = require('https');

console.log('🔍 Testing with exact payload that failed...\n');

const ZED_CONFIG = {
  baseUrl: 'https://api.dev.zed.business',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub2IiOnsidmFsdWUiOjUwLCJzdGF0ZSI6ZmFsc2V9LCJ2b2NiIjpmYWxzZSwidXNlcklkIjoiNjQ5ZDJlMTc2MmFlMjJkZjg2ZjAxNjk3IiwiaWQiOiI2NDlkMmUxNzYyYWUyMmRmODZmMDE2OTciLCJlbWFpbCI6ImtpbWF0aGljaHJpczEzK2RhaWx5aG90ZWxAZ21haWwuY29tIiwidXNlck5hbWUiOiJCcmlhbkdpdGh1YSIsImdyb3VwIjoiTWVyY2hhbnQiLCJiaWQiOiI5MDAyNzQyIiwiYmlkU3RyaW5nIjoiNjhiMTQ4MjM4MDRlNWRmNzA5ZGU2MWM3IiwiY3VzdG9tZXJJZCI6IjY2MjY1ZmYzZDg5Njc1YTk3NTY1ZGRkYSIsImJ1c2luZXNzTmFtZSI6IkRhaWx5IEhvdGVsIiwiYnVzaW5lc3NPd25lclBob25lIjoiKzI1NDU0NTQ1NDU0NCIsImJ1c2luZXNzT3duZXJBZGRyZXNzIjoiTmFpcm9iaSwgS2VueWEiLCJidWxrVGVybWluYWxzIjpbXSwic2Vzc2lvbkV4cGlyeSI6IjIwMjUtMDgtMzBUMDY6MjY6NDUuMjM5WiIsIlRpbGwiOiIiLCJQYXliaWxsIjoiIiwiVm9vbWEiOiIiLCJFcXVpdGVsIjoiIiwic3RvcmVOYW1lIjoibnVsbCIsImxvY2FsQ3VycmVuY3kiOiJLRVMiLCJ4ZXJvQWNjb3VudGluZ0VuYWJsZWQiOiJmYWxzZSIsInF1aWNrYm9va3NBY2NvdW50aW5nRW5hYmxlZCI6ImZhbHNlIiwiem9ob0FjY291bnRpbmdFbmFibGVkIjoiZmFsc2UiLCJpYXQiOjE3NTY0NDg4MDUsImV4cCI6MTc1NjUzNTIwNX0.4LrMoetiZiTSc7HzeCGuAaxnEk1tP7e3F05ccxxxtwc'
};

function testExactPayload() {
  // This is the exact payload that failed according to the logs
  const testData = JSON.stringify({
    amount: 9.44,
    phone: '254721121953',
    type: 'bookingTicket',
    externalOrigin: '9002742',
    orderIds: ['ORD-6478'],
    batchId: ''
  });

  const options = {
    hostname: 'api.dev.zed.business',
    port: 443,
    path: '/api/v1/payments/initiate_kcb_stk_push',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZED_CONFIG.authToken}`,
      'X-Authorization': ZED_CONFIG.authToken,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
      'Accept': 'application/json'
    },
    timeout: 15000
  };

  console.log('📡 Testing exact failed payload:');
  console.log(JSON.stringify(JSON.parse(testData), null, 2));
  console.log();

  const request = https.request(options, (response) => {
    console.log(`📡 Status: ${response.statusCode} ${response.statusMessage}`);
    
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      console.log(`Response: ${data}`);
      
      if (response.statusCode === 502) {
        console.log('\n❌ CONFIRMED: This exact payload causes 502 Bad Gateway');
        console.log('\n💡 Possible causes:');
        console.log('1. 📱 Invalid phone number format for M-Pesa');
        console.log('2. 💰 Amount too small (9.44 KES)'); 
        console.log('3. 🔄 Rate limiting or temporary API issues');
        console.log('4. 🎯 Order ID format issue (though ORD-6478 should work)');
      } else if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log('\n✅ This payload works now! The issue might be intermittent.');
      } else {
        console.log(`\n⚠️  Got different error: ${response.statusCode}`);
      }
    });
  });

  request.on('error', (error) => {
    console.log(`❌ Connection Error: ${error.message}`);
  });

  request.on('timeout', () => {
    console.log('❌ Request Timeout (15s)');
    request.destroy();
  });

  request.write(testData);
  request.end();
}

testExactPayload();
