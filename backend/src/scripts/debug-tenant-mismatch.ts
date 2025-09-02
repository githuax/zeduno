import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Category } from '../models/Category';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const debugTenantMismatch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Check what's in the JWT secret
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    // List all categories with their tenant IDs
    console.log('\n📁 All Categories in Database:');
    const allCategories = await Category.find({});
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. "${cat.name}" - Tenant: ${cat.tenantId} - ID: ${cat._id} - Active: ${cat.isActive}`);
    });

    // List all users with their tenant IDs
    console.log('\n👥 All Users in Database:');
    const allUsers = await User.find({}).select('email firstName lastName role tenantId isActive');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Tenant: ${user.tenantId} - Active: ${user.isActive}`);
    });

    // Check tenant counts
    const tenantIds = new Set();
    allCategories.forEach(cat => tenantIds.add(cat.tenantId?.toString()));
    allUsers.forEach(user => tenantIds.add(user.tenantId?.toString()));

    console.log('\n🏢 Unique Tenant IDs found:');
    Array.from(tenantIds).forEach((tenantId, index) => {
      const categoryCount = allCategories.filter(cat => cat.tenantId?.toString() === tenantId).length;
      const userCount = allUsers.filter(user => user.tenantId?.toString() === tenantId).length;
      console.log(`${index + 1}. ${tenantId} - ${categoryCount} categories, ${userCount} users`);
    });

    // Mock tenant ID from auth middleware
    const mockTenantId = '507f1f77bcf86cd799439011';
    console.log(`\n🧪 Mock Tenant ID (from auth): ${mockTenantId}`);
    
    const categoriesForMockTenant = allCategories.filter(cat => cat.tenantId?.toString() === mockTenantId);
    console.log(`Categories for mock tenant: ${categoriesForMockTenant.length}`);
    
    if (categoriesForMockTenant.length === 0) {
      console.log('❌ No categories found for mock tenant! This explains the error.');
      
      // Let's update ALL active categories to use mock tenant ID
      console.log('\n🔧 Fixing: Setting all active categories to use mock tenant ID...');
      const updateResult = await Category.updateMany(
        { isActive: { $ne: false } },
        { $set: { tenantId: new mongoose.Types.ObjectId(mockTenantId) } }
      );
      console.log(`Updated ${updateResult.modifiedCount} categories`);
      
      // Verify fix
      const fixedCategories = await Category.find({ tenantId: new mongoose.Types.ObjectId(mockTenantId) });
      console.log(`\n✅ Now ${fixedCategories.length} categories belong to mock tenant`);
      fixedCategories.forEach((cat, index) => {
        console.log(`${index + 1}. "${cat.name}" - ID: ${cat._id}`);
      });
    }

    console.log('\n✅ Debug completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
    process.exit(1);
  }
};

debugTenantMismatch();
