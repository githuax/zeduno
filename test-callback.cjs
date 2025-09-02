#!/usr/bin/env node

// Test the enhanced callback handler with sample data
const http = require('http');

const CALLBACK_URL = 'http://192.168.2.43:5000/api/mpesa-kcb/callback';

// Sample successful payment callback from Zed Business
const successfulCallback = {
  ResultCode: '0',
  ResultDesc: 'The service request is processed successfully.',
  MerchantRequestID: 'ws_CO_13012022140408797',
  CheckoutRequestID: 'ws_CO_13012022140408797',
  resultCode: 0,
  status: 'success',
  Amount: 500,
  MpesaReceiptNumber: 'QED123456',
  TransactionDate: '20220113140408',
  PhoneNumber: '254708374149',
  orderId: '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId
  reference: 'ORD-20250101-1234',
  accountReference: 'ORD-20250101-1234',
  customerName: 'John Doe',
  currency: 'KES',
  description: 'Payment for Order #ORD-20250101-1234'
};

// Sample failed payment callback
const failedCallback = {
  ResultCode: '1',
  ResultDesc: 'The balance is insufficient for the transaction.',
  MerchantRequestID: 'ws_CO_13012022140408798',
  CheckoutRequestID: 'ws_CO_13012022140408798',
  resultCode: 1,
  status: 'failed',
  errorMessage: 'Insufficient balance',
  PhoneNumber: '254708374149',
  orderId: '507f1f77bcf86cd799439012',
  reference: 'ORD-20250101-5678',
  customerName: 'Jane Doe'
};

async function testCallback(testName, callbackData) {
  console.log(`\n🧪 Testing ${testName}...`);
  console.log('📤 Sending callback data:', JSON.stringify(callbackData, null, 2));
  
  const postData = JSON.stringify(callbackData);
  
  const options = {
    hostname: '192.168.2.43',
    port: 5000,
    path: '/api/mpesa-kcb/callback',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📥 Response Status: ${res.statusCode}`);
        console.log(`📥 Response Body: ${data}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Request failed: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.error(`⏱️ Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Enhanced Callback Handler Tests');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Successful payment callback
    await testCallback('Successful Payment', successfulCallback);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Failed payment callback
    await testCallback('Failed Payment', failedCallback);
    
    // Test 3: Basic connectivity test
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testCallback('Basic Connectivity', { test: true, timestamp: new Date().toISOString() });
    
    console.log('\n✅ All callback tests completed!');
    console.log('\n📊 Check the backend logs for detailed processing information.');
    console.log('💾 Check the database for order and transaction updates.');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

runTests();
