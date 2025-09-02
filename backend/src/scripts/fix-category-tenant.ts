import mongoose from 'mongoose';
import { Category } from '../models/Category';
import dotenv from 'dotenv';

dotenv.config();

const fixCategoryTenant = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // The tenant ID that mock users use (from auth middleware)
    const mockTenantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Check existing categories
    const existingCategories = await Category.find({});
    console.log(`Found ${existingCategories.length} existing categories`);
    
    if (existingCategories.length > 0) {
      console.log('Existing categories:');
      existingCategories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (Tenant: ${cat.tenantId})`);
      });
      
      // Update all categories to use the mock tenant ID
      const updateResult = await Category.updateMany(
        {},
        { $set: { tenantId: mockTenantId } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} categories to use tenant ID: ${mockTenantId}`);
    } else {
      // Create some basic categories if none exist
      console.log('No categories found. Creating basic categories...');
      
      const defaultCategories = [
        { name: 'Main Courses', description: 'Main dish items', displayOrder: 1 },
        { name: 'Appetizers', description: 'Starter dishes', displayOrder: 2 },
        { name: 'Beverages', description: 'Drinks and beverages', displayOrder: 3 },
        { name: 'Desserts', description: 'Sweet treats', displayOrder: 4 }
      ];
      
      for (const catData of defaultCategories) {
        await Category.create({
          ...catData,
          tenantId: mockTenantId,
          isActive: true
        });
      }
      
      console.log(`Created ${defaultCategories.length} default categories`);
    }
    
    // Verify the fix
    const updatedCategories = await Category.find({ tenantId: mockTenantId });
    console.log(`\nVerification: Found ${updatedCategories.length} categories with correct tenant ID`);
    updatedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat._id})`);
    });
    
    console.log('\n✅ Category tenant fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
    process.exit(1);
  }
};

fixCategoryTenant();
