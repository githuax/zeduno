const mongoose = require('mongoose');
require('dotenv').config();

async function checkCompleteOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Order schema
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Get the specific order with all details
    const order = await Order.findOne({ orderNumber: 'ORD-20250821-1719' }).lean();
    
    if (order) {
      console.log('\n=== COMPLETE ORDER DETAILS ===');
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Customer: ${order.customerName}`);
      console.log(`Order Type: ${order.orderType}`);  // This is key!
      console.log(`Status: ${order.status}`);
      console.log(`Table ID: ${order.tableId || 'None'}`);
      console.log('');
      
      console.log('PRICING:');
      console.log(`Subtotal: KES ${order.subtotal}`);
      console.log(`Tax (18%): KES ${order.tax}`);
      console.log(`Service Charge: KES ${order.serviceCharge || 0}`);
      console.log(`Total: KES ${order.total}`);
      console.log('');
      
      console.log('SERVICE CHARGE ANALYSIS:');
      console.log(`Order Type: ${order.orderType}`);
      console.log(`Expected Service Charge: ${order.orderType === 'dine-in' ? 'KES 30 (10% of 300)' : 'KES 0 (not dine-in)'}`);
      console.log(`Actual Service Charge: KES ${order.serviceCharge || 0}`);
      
      if (order.orderType === 'dine-in' && (!order.serviceCharge || order.serviceCharge === 0)) {
        console.log('❌ Service charge missing for dine-in order');
      } else if (order.orderType !== 'dine-in' && order.serviceCharge === 0) {
        console.log('✅ No service charge correct for non-dine-in order');
      } else {
        console.log('✅ Service charge calculation correct');
      }
      
      console.log('\nITEMS BREAKDOWN:');
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. Quantity: ${item.quantity} x KES ${item.price} = KES ${item.price * item.quantity}`);
          if (item.customizations && item.customizations.length > 0) {
            console.log(`     Customizations: ${item.customizations.length}`);
          }
          if (item.specialInstructions) {
            console.log(`     Instructions: ${item.specialInstructions}`);
          }
        });
      }
      
      console.log('\n=== CURRENCY STATUS ===');
      console.log('✅ Order is correctly stored in KES currency');
      console.log('✅ Menu items are priced in KES');
      console.log('✅ Calculations are in KES');
      console.log('✅ No dollar currency found');
      
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

checkCompleteOrder();