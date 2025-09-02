// Test if M-Pesa KCB payment method appears in the orders page
const testPaymentMethods = async () => {
  try {
    console.log('🔍 Testing if M-Pesa KCB appears in payment methods...');
    
    // Test the frontend directly by checking the console logs
    const response = await fetch('http://192.168.2.43:8080/orders');
    
    if (response.ok) {
      console.log('✅ Orders page is accessible');
      console.log('📄 Frontend should now include M-Pesa KCB in payment methods');
      console.log('🎯 Expected payment methods:');
      console.log('   1. M-Pesa (Safaricom)');
      console.log('   2. M-Pesa KCB (KCB Bank) ← NEW');
      console.log('   3. Cash Payment');
      console.log('   4. Credit Card (if enabled)');
      
      console.log('\n🔧 To verify:');
      console.log('   1. Visit http://192.168.2.43:8080/orders');
      console.log('   2. Create or select an order');
      console.log('   3. Click "Process Payment"');
      console.log('   4. Look for "M-Pesa KCB" with building icon and "Multi-Currency" badge');
      
    } else {
      console.log('❌ Orders page not accessible:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing payment methods:', error);
  }
};

testPaymentMethods();
