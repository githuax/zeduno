import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const createTestFriday912 = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create the TESTFRIDAY912 tenant
    console.log('\n=== CREATING TESTFRIDAY912 TENANT ===');
    
    const existingTenant = await Tenant.findOne({ slug: 'testfriday912' });
    if (existingTenant) {
      console.log('✅ Tenant TESTFRIDAY912 already exists:', existingTenant.name);
    } else {
      const tenant = new Tenant({
        name: 'TESTFRIDAY912',
        slug: 'testfriday912',
        email: 'test1@mail.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City, Test State, 12345',
        tenantType: 'root',
        plan: 'basic',
        status: 'active',
        maxUsers: 100,
        currentUsers: 1,
        branchQuota: {
          maxBranches: 10,
          currentBranches: 0
        },
        inheritance: {
          menu: 'full',
          settings: 'full',
          users: 'isolated',
          pricing: 'inherit'
        },
        settings: {
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
          businessType: 'restaurant'
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false
        }
      });

      await tenant.save();
      console.log('✅ Created TESTFRIDAY912 tenant:', tenant._id);
    }

    // 2. Get the tenant for user creation
    const tenant = await Tenant.findOne({ slug: 'testfriday912' });
    if (!tenant) {
      throw new Error('Failed to create or find TESTFRIDAY912 tenant');
    }

    // 3. Create the test1@mail.com user
    console.log('\n=== CREATING test1@mail.com USER ===');
    
    const existingUser = await User.findOne({ email: 'test1@mail.com' });
    if (existingUser) {
      console.log('✅ User test1@mail.com already exists');
      
      // Update the user to ensure proper settings
      existingUser.tenantId = tenant._id as any;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      existingUser.mustChangePassword = false;
      existingUser.password = 'admin123'; // Will be hashed by pre-save hook
      await existingUser.save();
      console.log('✅ Updated user test1@mail.com with correct tenant and settings');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const user = new User({
        email: 'test1@mail.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        tenantId: tenant._id as any,
        isActive: true,
        mustChangePassword: false,
        accountStatus: 'active',
        emailVerified: true
      });

      await user.save();
      console.log('✅ Created test1@mail.com user:', user._id);
    }

    // 4. Verify the setup
    console.log('\n=== VERIFICATION ===');
    const user = await User.findOne({ email: 'test1@mail.com' })
      .populate('tenantId', 'name slug')
      .lean();
    
    if (user) {
      console.log('✅ User Details:');
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Active:', user.isActive);
      console.log('   Must Change Password:', user.mustChangePassword);
      console.log('   Tenant ID:', user.tenantId);
      console.log('   Tenant Name:', (user.tenantId as any)?.name);
      console.log('   Tenant Slug:', (user.tenantId as any)?.slug);
    }

    console.log('\n✅ TESTFRIDAY912 tenant and test1@mail.com user are ready!');
    console.log('🔑 Login credentials: test1@mail.com / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Creating TESTFRIDAY912 tenant and test1@mail.com user...');
createTestFriday912();