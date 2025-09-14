import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

dotenv.config();

const testUserLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    const email = 'kimathichris15@gmail.com';
    const testPasswords = [
      'password123',
      'Password123',
      'PASSWORD123',
      'kimathichris15',
      'chris123',
      'admin123',
      '123456',
      'password',
      'Password',
      '12345678'
    ];

    const user = await User.findOne({ email }); // Remove populate to avoid Tenant model issue
    
    if (!user) {
      console.log(`❌ User ${email} not found in database`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`TenantId: ${user.tenantId}`);
    console.log(`Has password hash: ${!!user.password}`);
    console.log(`Password hash length: ${user.password?.length}`);

    // Test various passwords
    console.log('\n🔍 Testing common passwords...');
    let foundPassword = false;
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await user.comparePassword(testPassword);
        console.log(`${testPassword.padEnd(15)} - ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
        if (isMatch) {
          console.log(`\n🎉 FOUND WORKING PASSWORD: "${testPassword}"`);
          foundPassword = true;
          break;
        }
      } catch (error) {
        console.log(`${testPassword.padEnd(15)} - ❌ Error: ${error}`);
      }
    }

    if (!foundPassword) {
      // Let's set a known password for this user
      console.log(`\n🔧 No matching password found. Setting known password for ${email}...`);
      user.password = 'password123'; // This will trigger the pre-save hash middleware
      await user.save();
      
      console.log(`✅ Password set to: password123`);
      console.log(`User can now login with: ${email} / password123`);
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testUserLogin();
