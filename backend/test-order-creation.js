const mongoose = require('mongoose');
require('dotenv').config();

async function testOrderCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Order model - directly define the schema since we can't import TypeScript
    const orderSchema = new mongoose.Schema({
      orderNumber: String,
      customerName: String,
      status: String,
      staffId: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
      updatedAt: Date
    });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Count orders before
    const countBefore = await Order.countDocuments();
    console.log(`Orders in database before: ${countBefore}`);
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customerName status createdAt staffId');
    
    console.log('\nRecent orders:');
    recentOrders.forEach(order => {
      console.log(`- ${order.orderNumber}: ${order.customerName} (Status: ${order.status}, Staff: ${order.staffId}, Created: ${order.createdAt})`);
    });
    
    // Check for orders without staffId
    const ordersWithoutStaff = await Order.find({ staffId: { $exists: false } }).countDocuments();
    console.log(`\nOrders without staffId: ${ordersWithoutStaff}`);
    
    // Check for orders with null staffId
    const ordersWithNullStaff = await Order.find({ staffId: null }).countDocuments();
    console.log(`Orders with null staffId: ${ordersWithNullStaff}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testOrderCreation();