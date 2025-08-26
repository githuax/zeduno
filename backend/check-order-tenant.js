const mongoose = require('mongoose');
require('dotenv').config();

async function checkOrderTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define Order schema with tenantId
    const orderSchema = new mongoose.Schema({
      orderNumber: String,
      customerName: String,
      tenantId: mongoose.Schema.Types.ObjectId,
      staffId: mongoose.Schema.Types.ObjectId,
      status: String,
      createdAt: Date
    });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Get all orders with tenant info
    const orders = await Order.find().select('orderNumber customerName tenantId staffId status createdAt');
    
    console.log(`\nTotal orders: ${orders.length}`);
    
    orders.forEach(order => {
      console.log(`\nOrder: ${order.orderNumber}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Tenant ID: ${order.tenantId}`);
      console.log(`  Staff ID: ${order.staffId}`);
      console.log(`  Status: ${order.status}`);
    });
    
    // Check users and their tenant IDs
    const userSchema = new mongoose.Schema({
      email: String,
      tenantId: mongoose.Schema.Types.ObjectId
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const users = await User.find().select('email tenantId');
    console.log('\n--- User Tenant IDs ---');
    users.forEach(user => {
      console.log(`${user.email}: Tenant ID = ${user.tenantId}`);
    });
    
    // Check if order tenantId matches any user tenantId
    if (orders.length > 0 && users.length > 0) {
      const order = orders[0];
      const matchingUser = users.find(u => u.tenantId && u.tenantId.toString() === order.tenantId?.toString());
      if (matchingUser) {
        console.log(`\n✅ Order tenant ID matches user ${matchingUser.email}`);
      } else {
        console.log(`\n⚠️ Order tenant ID doesn't match any user's tenant ID`);
        console.log(`Order tenantId: ${order.tenantId}`);
        console.log(`User tenantIds: ${users.map(u => u.tenantId).filter(Boolean).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrderTenant();