import mongoose from 'mongoose';

import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const cleanupMenuData = async () => {
  try {
    await connectDB();

    console.log('🧹 Starting cleanup of menu data...\n');

    // First, let's see what we have
    const allCategories = await Category.find({});
    const allMenuItems = await MenuItem.find({});
    
    console.log(`Found ${allCategories.length} categories`);
    console.log(`Found ${allMenuItems.length} menu items\n`);

    // Delete old test categories and duplicate categories
    const categoriesToDelete = await Category.find({
      $or: [
        { name: 'test category' },
        { _id: '68a19f17ee7482cfe1964fdf' }, // test category
        { _id: '68a19f68ee7482cfe1964ff8' }, // old main course
        { _id: '68a1a11dee7482cfe196505f' }, // old appetizers
        { _id: '68a33200fcd9a996816d5408' }  // salads
      ]
    });

    console.log(`Deleting ${categoriesToDelete.length} old/duplicate categories...`);
    for (const cat of categoriesToDelete) {
      console.log(`  - Deleting: ${cat.name} (${cat._id})`);
      await Category.deleteOne({ _id: cat._id });
    }

    // Delete old test menu items and duplicates
    const itemsToDelete = await MenuItem.find({
      $or: [
        { name: 'Test Pizza' },
        { name: 'SOUP OF MUSHROOM' },
        { price: 12.99 }, // Test Pizza
        { price: 59 }     // Old SOUP OF CARROT
      ]
    });

    console.log(`\nDeleting ${itemsToDelete.length} old/duplicate menu items...`);
    for (const item of itemsToDelete) {
      console.log(`  - Deleting: ${item.name} (KES ${item.price})`);
      await MenuItem.deleteOne({ _id: item._id });
    }

    // Keep only the latest categories (created by our script)
    const latestCategories = await Category.find({
      name: { $in: ['appetizers', 'main course', 'desserts', 'beverages'] }
    }).sort({ _id: -1 }).limit(4);

    console.log('\n✅ Keeping latest categories:');
    latestCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat._id})`);
    });

    // Get the final count
    const finalCategories = await Category.find({});
    const finalMenuItems = await MenuItem.find({});
    
    console.log('\n📊 Final Database State:');
    console.log(`Categories: ${finalCategories.length}`);
    console.log(`Menu Items: ${finalMenuItems.length}`);

    // List final menu items
    console.log('\n🍽️ Final Menu Items:');
    const items = await MenuItem.find({}).populate('categoryId');
    items.forEach(item => {
      const categoryName = item.categoryId ? (item.categoryId as any).name : 'No category';
      console.log(`  - ${item.name} (KES ${item.price}) - ${categoryName}`);
    });

    console.log('\n✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

cleanupMenuData();