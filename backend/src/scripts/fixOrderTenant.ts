import mongoose from 'mongoose';

import Order from '../models/Order';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixOrderTenantId = async () => {
  try {
    await connectDB();

    const mockTenantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    console.log('Updating orders tenantId...');
    const result = await Order.updateMany(
      {},
      { tenantId: mockTenantId }
    );
    console.log(`Updated ${result.modifiedCount} orders`);

    const orders = await Order.find({}).populate('items.menuItem');
    console.log(`Total orders: ${orders.length}`);
    
    orders.forEach(order => {
      console.log(`- ${order.orderNumber} (${order.orderType}) - ${order.customerName}`);
      console.log(`  Status: ${order.status}, Total: KES ${order.total}`);
      console.log(`  Items: ${order.items.length}, TenantId: ${order.tenantId}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixOrderTenantId();
