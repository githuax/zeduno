/**
 * Test script to verify frontend cash payment integration
 * Run this in browser console to test the cash payment flow
 */

// Simulate the payment processing flow
async function testCashPaymentFrontend() {
  console.log('🧪 Testing Frontend Cash Payment Integration');
  console.log('==========================================');
  
  try {
    // Get API URL (simulate getApiUrl function)
    const getApiUrl = () => {
      if (window.location.hostname === '192.168.2.43') {
        return 'http://192.168.2.43:5000/api';
      }
      return '/api';
    };
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No auth token found. Please login first.');
      return;
    }
    
    // Mock payment intent (this would come from the payment dialog)
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: 1000,
      currency: 'KES',
      paymentMethod: 'cash',
      orderId: '68aed3394e7a378f7c6f19bb', // Use a real order ID
      customerInfo: { name: 'Test Customer' },
      metadata: { tipAmount: 0, taxAmount: 85, processingFee: 0 }
    };
    
    console.log('💰 Processing payment intent:', paymentIntent);
    
    // Simulate the useProcessPayment mutation logic
    const response = await fetch(`${getApiUrl()}/orders/${paymentIntent.orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        paidAt: new Date().toISOString(),
        totalAmount: paymentIntent.amount
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process cash payment');
    }
    
    const updatedOrder = await response.json();
    console.log('✅ Cash payment processed successfully!');
    console.log('📋 Updated Order:', {
      id: updatedOrder._id,
      paymentStatus: updatedOrder.paymentStatus,
      paymentMethod: updatedOrder.paymentMethod,
      paidAt: updatedOrder.paidAt
    });
    
    // Simulate successful return value
    const result = {
      id: `cash_${Date.now()}`,
      status: 'completed',
      amount: paymentIntent.amount,
      timestamp: new Date(),
      paymentMethod: 'cash',
      orderId: paymentIntent.orderId
    };
    
    console.log('🎉 Payment result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Frontend cash payment test failed:', error);
    throw error;
  }
}

// Instructions for manual testing
console.log(`
🔧 Frontend Cash Payment Test Ready!

To test cash payments:
1. Make sure you're logged in to the application
2. Open the browser console
3. Run: testCashPaymentFrontend()
4. Check that the order payment status updates correctly

API URL will be: ${window.location.hostname === '192.168.2.43' ? 'http://192.168.2.43:5000/api' : '/api'}
`);

// Make the test function available globally
window.testCashPaymentFrontend = testCashPaymentFrontend;
