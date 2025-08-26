const mongoose = require('mongoose');
require('dotenv').config();

async function checkUpdatedOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Order schema with adjustments
    const orderSchema = new mongoose.Schema({
      orderNumber: String,
      customerName: String,
      status: String,
      items: Array,
      adjustments: Array,
      adjustmentNotes: String,
      total: Number,
      subtotal: Number,
      tax: Number,
      serviceCharge: Number,
      updatedAt: Date,
      createdAt: Date
    }, { strict: false });
    
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Get all orders sorted by most recently updated
    const orders = await Order.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`\nFound ${orders.length} recent orders\n`);
    
    orders.forEach((order, index) => {
      console.log(`--- Order ${index + 1} ---`);
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Customer: ${order.customerName}`);
      console.log(`Status: ${order.status}`);
      console.log(`Items Count: ${order.items ? order.items.length : 0}`);
      console.log(`Total: ${order.total}`);
      console.log(`Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`Updated: ${new Date(order.updatedAt).toLocaleString()}`);
      
      // Check if order has adjustments
      if (order.adjustments && order.adjustments.length > 0) {
        console.log(`\n  ✅ ORDER HAS ADJUSTMENTS (${order.adjustments.length}):`);
        order.adjustments.forEach((adj, i) => {
          console.log(`  ${i + 1}. Type: ${adj.type}, Reason: ${adj.reason}`);
          if (adj.details) console.log(`     Details: ${adj.details}`);
          if (adj.timestamp) console.log(`     Time: ${new Date(adj.timestamp).toLocaleString()}`);
        });
      } else {
        console.log(`  ⚠️ No adjustments found`);
      }
      
      if (order.adjustmentNotes) {
        console.log(`  Adjustment Notes: ${order.adjustmentNotes}`);
      }
      
      // Show items details
      if (order.items && order.items.length > 0) {
        console.log(`\n  Items in order:`);
        order.items.forEach((item, i) => {
          console.log(`  ${i + 1}. Quantity: ${item.quantity}, Price: ${item.price}`);
          if (item.specialInstructions) {
            console.log(`     Instructions: ${item.specialInstructions}`);
          }
        });
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
    // Check specifically for the order we edited
    const specificOrder = await Order.findOne({ orderNumber: 'ORD-20250821-1719' }).lean();
    if (specificOrder) {
      console.log('CHECKING SPECIFIC ORDER (ORD-20250821-1719):');
      console.log(`- Items: ${specificOrder.items ? specificOrder.items.length : 0}`);
      console.log(`- Has adjustments: ${specificOrder.adjustments ? 'YES' : 'NO'}`);
      console.log(`- Last updated: ${new Date(specificOrder.updatedAt).toLocaleString()}`);
      console.log(`- Total: ${specificOrder.total}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUpdatedOrders();