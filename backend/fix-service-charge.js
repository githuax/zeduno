const mongoose = require('mongoose');
require('dotenv').config();

async function fixServiceCharge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Order schema
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Find the specific order
    const order = await Order.findOne({ orderNumber: 'ORD-20250821-1719' });
    
    if (order) {
      console.log('\n=== FIXING SERVICE CHARGE ===');
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Order Type: ${order.orderType}`);
      console.log(`Current Subtotal: KES ${order.subtotal}`);
      console.log(`Current Service Charge: KES ${order.serviceCharge || 0}`);
      console.log(`Current Total: KES ${order.total}`);
      
      if (order.orderType === 'dine-in') {
        // Recalculate service charge
        const correctServiceCharge = order.subtotal * 0.1; // 10% service charge
        const correctTotal = order.subtotal + order.tax + correctServiceCharge;
        
        console.log('\nCORRECT VALUES:');
        console.log(`Correct Service Charge: KES ${correctServiceCharge}`);
        console.log(`Correct Total: KES ${correctTotal}`);
        
        // Update the order
        order.serviceCharge = correctServiceCharge;
        order.total = correctTotal;
        await order.save();
        
        console.log('\n✅ Order updated successfully!');
        console.log(`New Service Charge: KES ${order.serviceCharge}`);
        console.log(`New Total: KES ${order.total}`);
        
      } else {
        console.log('Order is not dine-in, no service charge needed');
      }
      
    } else {
      console.log('Order not found');
    }
    
    // Check all dine-in orders that might have missing service charges
    console.log('\n=== CHECKING ALL DINE-IN ORDERS ===');
    const dineInOrders = await Order.find({ 
      orderType: 'dine-in',
      serviceCharge: { $in: [0, null, undefined] }
    });
    
    console.log(`Found ${dineInOrders.length} dine-in orders with missing service charges`);
    
    for (const dineOrder of dineInOrders) {
      console.log(`\nFixing order ${dineOrder.orderNumber}:`);
      const correctServiceCharge = dineOrder.subtotal * 0.1;
      const correctTotal = dineOrder.subtotal + dineOrder.tax + correctServiceCharge;
      
      dineOrder.serviceCharge = correctServiceCharge;
      dineOrder.total = correctTotal;
      await dineOrder.save();
      
      console.log(`  Service Charge: 0 → KES ${correctServiceCharge}`);
      console.log(`  Total: KES ${dineOrder.total - correctServiceCharge + (dineOrder.serviceCharge || 0)} → KES ${correctTotal}`);
    }
    
    console.log(`\n✅ Fixed ${dineInOrders.length} orders`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixServiceCharge();