import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const listAllTenants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Get all users from database
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${allUsers.length} users in database:\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏢 Role: ${user.role}`);
      console.log(`   🏷️  Tenant ID: ${user.tenantId}`);
      console.log(`   ✅ Active: ${user.isActive}`);
      console.log(`   📅 Created: ${user.createdAt}`);
      console.log('');
    });

    // Group users by tenant
    const tenantGroups = new Map();
    allUsers.forEach(user => {
      const tenantId = user.tenantId?.toString() || 'no-tenant';
      if (!tenantGroups.has(tenantId)) {
        tenantGroups.set(tenantId, []);
      }
      tenantGroups.get(tenantId).push(user);
    });

    console.log('🏢 Users grouped by Tenant:');
    tenantGroups.forEach((users, tenantId) => {
      console.log(`\nTenant: ${tenantId}`);
      users.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      });
    });

    // Test login for each user
    console.log('\n🔐 Testing login with password123 for each user:');
    for (const user of allUsers) {
      try {
        const isMatch = await user.comparePassword('password123');
        console.log(`${user.email.padEnd(30)} - ${isMatch ? '✅ Can login' : '❌ Wrong password'}`);
      } catch (error) {
        console.log(`${user.email.padEnd(30)} - ❌ Error: ${error}`);
      }
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

listAllTenants();
