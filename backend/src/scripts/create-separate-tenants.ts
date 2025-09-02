import mongoose from 'mongoose';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import dotenv from 'dotenv';

dotenv.config();

const createSeparateTenants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Create two separate tenant IDs
    const tenant1Id = new mongoose.Types.ObjectId(); // First restaurant
    const tenant2Id = new mongoose.Types.ObjectId(); // Second restaurant

    console.log(`🏢 Creating two separate tenants:`);
    console.log(`Tenant 1 (Chris's Restaurant): ${tenant1Id}`);
    console.log(`Tenant 2 (Dama's Restaurant): ${tenant2Id}`);

    // Update Chris to belong to Tenant 1
    await User.findOneAndUpdate(
      { email: 'kimathichris15@gmail.com' },
      { tenantId: tenant1Id }
    );

    // Update Dama to belong to Tenant 2
    await User.findOneAndUpdate(
      { email: 'dama@mail.com' },
      { tenantId: tenant2Id }
    );

    // Keep SuperAdmin in the original tenant (or assign to tenant 1)
    await User.findOneAndUpdate(
      { email: 'superadmin@zeduno.com' },
      { tenantId: tenant1Id }
    );

    console.log('\n👥 Updated user tenants');

    // Create categories for each tenant
    
    // Tenant 1 Categories (Chris's Restaurant)
    const chris_appetizer = await Category.create({
      name: 'Appetizers',
      description: 'Starter dishes for Chris\'s Restaurant',
      displayOrder: 1,
      tenantId: tenant1Id,
      isActive: true
    });

    const chris_main = await Category.create({
      name: 'Main Courses', 
      description: 'Main dishes for Chris\'s Restaurant',
      displayOrder: 2,
      tenantId: tenant1Id,
      isActive: true
    });

    // Tenant 2 Categories (Dama's Restaurant)
    const dama_appetizer = await Category.create({
      name: 'Starters',
      description: 'Starter dishes for Dama\'s Restaurant',
      displayOrder: 1,
      tenantId: tenant2Id,
      isActive: true
    });

    const dama_main = await Category.create({
      name: 'Entrees',
      description: 'Main dishes for Dama\'s Restaurant', 
      displayOrder: 2,
      tenantId: tenant2Id,
      isActive: true
    });

    console.log('\n📁 Created separate categories for each tenant');

    // Create sample menu items for each tenant

    // Chris's Restaurant Items
    await MenuItem.create({
      name: 'Chris\'s Special Burger',
      description: 'House specialty burger',
      price: 1200,
      categoryId: chris_main._id,
      tenantId: tenant1Id,
      isAvailable: true,
      preparationTime: 20,
      tags: ['popular', 'signature'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 'mild',
      isActive: true
    });

    await MenuItem.create({
      name: 'Wings Supreme',
      description: 'Spicy buffalo wings',
      price: 800,
      categoryId: chris_appetizer._id,
      tenantId: tenant1Id,
      isAvailable: true,
      preparationTime: 15,
      tags: ['spicy', 'popular'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 'hot',
      isActive: true
    });

    // Dama's Restaurant Items
    await MenuItem.create({
      name: 'Dama\'s Pasta Delight',
      description: 'Creamy alfredo pasta',
      price: 1100,
      categoryId: dama_main._id,
      tenantId: tenant2Id,
      isAvailable: true,
      preparationTime: 25,
      tags: ['vegetarian', 'creamy'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 'mild',
      isActive: true
    });

    await MenuItem.create({
      name: 'Mediterranean Salad',
      description: 'Fresh garden salad',
      price: 600,
      categoryId: dama_appetizer._id,
      tenantId: tenant2Id,
      isAvailable: true,
      preparationTime: 10,
      tags: ['healthy', 'fresh'],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 'mild',
      isActive: true
    });

    console.log('\n🍽️ Created sample menu items for each tenant');

    // Clear old categories and menu items that were shared
    await Category.deleteMany({ tenantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') });
    await MenuItem.deleteMany({ tenantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') });

    console.log('\n🧹 Cleaned up old shared data');

    console.log('\n✅ Tenant separation completed!');
    console.log('\n🔑 Login credentials:');
    console.log(`📧 Chris (Tenant ${tenant1Id}): kimathichris15@gmail.com / password123`);
    console.log(`📧 Dama (Tenant ${tenant2Id}): dama@mail.com / password123`);
    console.log('\nEach tenant will now only see their own menu items and categories!');

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createSeparateTenants();
