const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function testZedMPesa() {
  try {
    // Generate JWT token
    const token = jwt.sign({
      id: 'mock-user-id',
      tenantId: '507f1f77bcf86cd799439011'
    }, 'dev-secret-key-change-in-production', { expiresIn: '1h' });

    console.log('🚀 Testing REAL M-Pesa KCB via Zed Business API...');
    console.log('📱 Phone: +254721121953');
    console.log('💰 Amount: KES 1.00');
    
    const payload = {
      orderId: `DSH-REAL-TEST-${Date.now()}`,
      amount: 1,
      currency: 'KES',
      phoneNumber: '+254721121953',
      customerName: 'Brian Githua',
      description: 'Real M-Pesa test via Zed Business'
    };

    console.log('📤 Sending request to backend...');

    const response = await fetch('http://localhost:5000/api/mpesa-kcb/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    console.log('\n📡 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ STK PUSH SENT SUCCESSFULLY!');
      console.log('📱 CHECK YOUR PHONE (+254721121953) FOR M-PESA PROMPT');
      console.log('💳 Transaction ID:', result.data?.transactionId);
      console.log('🔗 Reference:', result.reference);
    } else {
      console.log('❌ STK Push Failed');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

    console.log('\nFull Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testZedMPesa();
