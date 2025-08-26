const mongoose = require('mongoose');
require('dotenv').config();

async function verifyFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Order schema - force no caching
    const orderSchema = new mongoose.Schema({}, { strict: false });
    // Create a new model with a unique name to avoid caching
    const OrderCheck = mongoose.model('OrderCheck', orderSchema, 'orders');
    
    // Get the order fresh from database
    const order = await OrderCheck.findOne({ orderNumber: 'ORD-20250821-1719' }).lean();
    
    if (order) {
      console.log('\n=== VERIFICATION RESULTS ===');
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Order Type: ${order.orderType}`);
      console.log('');
      
      console.log('CURRENT VALUES IN DATABASE:');
      console.log(`Subtotal: KES ${order.subtotal}`);
      console.log(`Tax (18%): KES ${order.tax}`);
      console.log(`Service Charge: KES ${order.serviceCharge}`);
      console.log(`Total: KES ${order.total}`);
      console.log('');
      
      // Verify calculations
      const expectedServiceCharge = order.orderType === 'dine-in' ? order.subtotal * 0.1 : 0;
      const expectedTotal = order.subtotal + order.tax + expectedServiceCharge;
      
      console.log('VERIFICATION:');
      console.log(`Expected Service Charge: KES ${expectedServiceCharge}`);
      console.log(`Actual Service Charge: KES ${order.serviceCharge}`);
      console.log(`Service Charge Correct: ${order.serviceCharge === expectedServiceCharge ? '✅' : '❌'}`);
      console.log('');
      
      console.log(`Expected Total: KES ${expectedTotal}`);
      console.log(`Actual Total: KES ${order.total}`);
      console.log(`Total Correct: ${order.total === expectedTotal ? '✅' : '❌'}`);
      
      if (order.serviceCharge === expectedServiceCharge && order.total === expectedTotal) {
        console.log('\n🎉 SERVICE CHARGE FIX SUCCESSFUL!');
      } else {
        console.log('\n❌ Fix may not have worked correctly');
      }
      
    } else {
      console.log('Order not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyFix();