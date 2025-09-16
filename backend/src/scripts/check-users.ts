import { config } from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const checkUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({})
      .populate('tenantId', 'name _id')
      .lean();
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`, user.email);
      console.log('   Role:', user.role);
      console.log('   Active:', user.isActive);
      console.log('   Tenant ID:', user.tenantId?._id || user.tenantId);
      console.log('   Tenant Name:', (user.tenantId as any)?.name || 'N/A');
      console.log('   Must Change Password:', user.mustChangePassword || false);
    });

    // Find all tenants
    const tenants = await Tenant.find({}).lean();
    console.log('\n\n=== ALL TENANTS IN DATABASE ===');
    tenants.forEach((tenant, index) => {
      console.log(`\n${index + 1}. Tenant:`, tenant.name);
      console.log('   Slug:', tenant.slug);
      console.log('   Email:', tenant.email);
      console.log('   Active:', tenant.isActive);
      console.log('   ID:', tenant._id);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Checking all users and tenants...');
checkUsers();