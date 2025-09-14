import { config } from 'dotenv';
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const checkTest1User = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test1@mail.com user exists
    const user = await User.findOne({ email: 'test1@mail.com' });
    
    if (user) {
      console.log('\n=== USER FOUND ===');
      console.log('Email:', user.email);
      console.log('First Name:', user.firstName);
      console.log('Last Name:', user.lastName);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('TenantId:', user.tenantId);
      console.log('Must Change Password:', user.mustChangePassword);
      console.log('Account Status:', user.accountStatus || 'not set');
      console.log('Created At:', user.createdAt);
      console.log('Password hash (first 20 chars):', user.password?.substring(0, 20) || 'no password');
      
      // Find associated tenant
      if (user.tenantId) {
        const tenant = await Tenant.findById(user.tenantId);
        if (tenant) {
          console.log('\n=== ASSOCIATED TENANT ===');
          console.log('Tenant ID:', tenant._id);
          console.log('Tenant Name:', tenant.name);
          console.log('Tenant Email:', tenant.email);
          console.log('Tenant Status:', tenant.status);
          console.log('Tenant Active:', tenant.isActive);
          console.log('Max Users:', tenant.maxUsers);
          console.log('Current Users:', tenant.currentUsers);
          console.log('Created By:', tenant.createdBy);
          console.log('Created At:', tenant.createdAt);
        } else {
          console.log('\n❌ TENANT NOT FOUND for tenantId:', user.tenantId);
          console.log('This could be the issue - user has tenantId but tenant doesn\'t exist');
        }
      } else {
        console.log('\n❌ USER HAS NO TENANT ID');
        console.log('This is definitely an issue for non-superadmin users');
      }

      // Test password comparison if we can
      try {
        // Common passwords to test
        const testPasswords = ['password123', 'admin123', 'test123', '12345678'];
        for (const testPassword of testPasswords) {
          const isValid = await user.comparePassword(testPassword);
          if (isValid) {
            console.log(`\n✅ PASSWORD FOUND: "${testPassword}" works for this user`);
            break;
          }
        }
      } catch (error) {
        console.log('\n⚠️  Could not test password comparison:', error);
      }
      
    } else {
      console.log('\n❌ USER NOT FOUND: test1@mail.com does not exist in the database');
      
      // List similar users
      console.log('\n=== SEARCHING FOR SIMILAR USERS ===');
      const similarUsers = await User.find({
        $or: [
          { email: { $regex: 'test', $options: 'i' } },
          { email: { $regex: 'admin', $options: 'i' } },
          { firstName: { $regex: 'test', $options: 'i' } }
        ]
      }).select('email firstName lastName role tenantId isActive').limit(10);
      
      if (similarUsers.length > 0) {
        console.log('Found similar users:');
        similarUsers.forEach(u => {
          console.log(`- ${u.email} | ${u.firstName} ${u.lastName} | ${u.role} | Tenant: ${u.tenantId} | Active: ${u.isActive}`);
        });
      } else {
        console.log('No similar users found');
      }

      // List all admin users
      console.log('\n=== ALL ADMIN USERS ===');
      const adminUsers = await User.find({ role: 'admin' })
        .select('email firstName lastName tenantId isActive')
        .populate('tenantId', 'name email status')
        .limit(20);
      
      if (adminUsers.length > 0) {
        adminUsers.forEach(u => {
          const tenantInfo = u.tenantId && typeof u.tenantId === 'object' 
            ? `${(u.tenantId as any).name} (${(u.tenantId as any).status})`
            : u.tenantId || 'NO TENANT';
          console.log(`- ${u.email} | ${u.firstName} ${u.lastName} | Tenant: ${tenantInfo} | Active: ${u.isActive}`);
        });
      } else {
        console.log('No admin users found');
      }
    }

    // Check all tenants
    console.log('\n=== ALL TENANTS ===');
    const allTenants = await Tenant.find({})
      .select('name email status isActive currentUsers maxUsers createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    if (allTenants.length > 0) {
      allTenants.forEach(t => {
        console.log(`- ${t.name} | ${t.email} | Status: ${t.status} | Active: ${t.isActive} | Users: ${t.currentUsers}/${t.maxUsers} | Created: ${t.createdAt.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('No tenants found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkTest1User();