import { config } from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const fixTest1Password = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test1@mail.com user
    const user = await User.findOne({ email: 'test1@mail.com' });
    
    if (!user) {
      console.log('❌ User test1@mail.com not found');
      return;
    }

    console.log('Found user:', user.email);
    console.log('Current mustChangePassword:', user.mustChangePassword);
    
    // Option 1: Remove the mustChangePassword requirement
    user.mustChangePassword = false;
    await user.save();
    
    console.log('✅ Fixed: mustChangePassword set to false');
    console.log('User can now login normally');

    // Optional: Set a known password for testing
    const setNewPassword = process.argv.includes('--set-password');
    if (setNewPassword) {
      user.password = 'admin123'; // This will be hashed by the pre-save hook
      await user.save();
      console.log('✅ Password set to: admin123');
    }

    console.log('\n=== UPDATED USER INFO ===');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('TenantId:', user.tenantId);
    console.log('Must Change Password:', user.mustChangePassword);
    console.log('Account Status:', user.accountStatus);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Fixing test1@mail.com password requirements...');
console.log('Run with --set-password flag to also set password to "admin123"');
fixTest1Password();