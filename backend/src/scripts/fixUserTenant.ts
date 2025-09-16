import mongoose from 'mongoose';

import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixTenantId = async () => {
  try {
    await connectDB();

    const mockTenantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    console.log('Updating menu items tenantId...');
    const itemsResult = await MenuItem.updateMany(
      {},
      { tenantId: mockTenantId }
    );
    console.log(`Updated ${itemsResult.modifiedCount} menu items`);

    console.log('Updating categories tenantId...');
    const categoriesResult = await Category.updateMany(
      {},
      { tenantId: mockTenantId }
    );
    console.log(`Updated ${categoriesResult.modifiedCount} categories`);

    const menuItems = await MenuItem.find({});
    const categories = await Category.find({});
    
    console.log(`Menu items: ${menuItems.length}`);
    console.log(`Categories: ${categories.length}`);

    console.log('Login with: admin@demo.com / admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixTenantId();
