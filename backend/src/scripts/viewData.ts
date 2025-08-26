import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import dotenv from 'dotenv';

dotenv.config();

const viewData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('🔌 Connected to MongoDB\n');

    // View SuperAdmins collection
    console.log('👑 SUPERADMINS:');
    console.log('================');
    const superAdmins = await mongoose.connection.db.collection('superadmins').find({}).toArray();
    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`   Role: ${admin.role}, Active: ${admin.isActive}`);
    });

    // View Tenants
    console.log('\n🏢 TENANTS:');
    console.log('============');
    const tenants = await Tenant.find({});
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
      console.log(`   Email: ${tenant.email}`);
      console.log(`   Plan: ${tenant.plan}, Status: ${tenant.status}`);
      console.log(`   Address: ${tenant.address}`);
    });

    // View Users
    console.log('\n👥 USERS:');
    console.log('==========');
    const users = await User.find({}).populate('tenantId', 'name');
    users.forEach((user, index) => {
      const tenantName = user.tenantId ? (user.tenantId as any).name : 'No Tenant';
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.role}, Tenant: ${tenantName}`);
      console.log(`   Active: ${user.isActive}`);
    });

    // View Categories
    console.log('\n📁 CATEGORIES:');
    console.log('==============');
    const categories = await Category.find({});
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat._id})`);
    });

    // View Menu Items
    console.log('\n🍽️ MENU ITEMS:');
    console.log('===============');
    const menuItems = await MenuItem.find({}).populate('categoryId');
    menuItems.forEach((item, index) => {
      const categoryName = item.categoryId ? (item.categoryId as any).name : 'No category';
      console.log(`${index + 1}. ${item.name}`);
      console.log(`   Price: KES ${item.price}, Category: ${categoryName}`);
      console.log(`   Available: ${item.isAvailable}, Active: ${item.isActive}`);
    });

    // Collection stats
    console.log('\n📊 DATABASE STATS:');
    console.log('===================');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error viewing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

viewData();