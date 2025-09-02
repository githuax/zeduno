#!/usr/bin/env node

const { io } = require('socket.io-client');

// Test WebSocket connection to production server
async function testWebSocketConnection() {
  console.log('🔍 Testing WebSocket connection to ZedUno production server...\n');
  
  const testUrls = [
    'https://zeduno.piskoe.com',
    'http://localhost:5000'
  ];
  
  for (const url of testUrls) {
    console.log(`📡 Testing: ${url}`);
    
    try {
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false
      });
      
      // Set up event listeners
      socket.on('connect', () => {
        console.log(`✅ Connected to ${url}`);
        console.log(`   Socket ID: ${socket.id}`);
        console.log(`   Transport: ${socket.io.engine.transport.name}`);
        socket.disconnect();
      });
      
      socket.on('connect_error', (error) => {
        console.log(`❌ Connection failed to ${url}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Type: ${error.type}`);
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected from ${url}: ${reason}\n`);
      });
      
      // Wait for connection attempt
      await new Promise(resolve => {
        setTimeout(() => {
          if (!socket.connected) {
            socket.disconnect();
          }
          resolve();
        }, 10000);
      });
      
    } catch (error) {
      console.log(`❌ Failed to test ${url}: ${error.message}\n`);
    }
  }
  
  console.log('🏁 WebSocket connection test completed');
}

// Test backend server status
async function testBackendStatus() {
  console.log('🔍 Testing backend server status...\n');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test local backend
    const localResponse = await fetch('http://localhost:5000/health');
    const localData = await localResponse.json();
    console.log('✅ Local backend (localhost:5000):');
    console.log(`   Status: ${localData.status}`);
    console.log(`   Message: ${localData.message}`);
    console.log(`   Socket Connections: ${localData.socketConnections}`);
    
  } catch (error) {
    console.log('❌ Local backend test failed:', error.message);
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test production health (might not exist)
    const prodResponse = await fetch('https://zeduno.piskoe.com/api/health', {
      timeout: 5000
    });
    
    if (prodResponse.ok) {
      const prodData = await prodResponse.json();
      console.log('✅ Production backend (zeduno.piskoe.com):');
      console.log(`   Status: ${prodData.status}`);
      console.log(`   Message: ${prodData.message}`);
      console.log(`   Socket Connections: ${prodData.socketConnections}`);
    } else {
      console.log('⚠️ Production health endpoint not accessible');
    }
    
  } catch (error) {
    console.log('⚠️ Production backend test failed:', error.message);
  }
  
  console.log('\n');
}

// Main test function
async function runTests() {
  console.log('🚀 ZedUno WebSocket Connection Test\n');
  console.log('='.repeat(50) + '\n');
  
  await testBackendStatus();
  await testWebSocketConnection();
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 Troubleshooting Tips:');
  console.log('1. Ensure nginx is running and configured properly');
  console.log('2. Check that /socket.io/ location is proxied to backend');
  console.log('3. Verify backend is running on port 5000');
  console.log('4. Check firewall settings for WebSocket connections');
  console.log('5. Ensure SSL certificates are valid (if using HTTPS)');
}

// Run the tests
runTests().catch(console.error);