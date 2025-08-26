import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import dotenv from 'dotenv';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Check if tenant exists, if not create one
    let tenant = await Tenant.findOne({ slug: 'demo-restaurant' });
    
    if (!tenant) {
      // Create a superadmin first to be the creator
      let superadmin = await User.findOne({ email: 'superadmin@hotelzed.com' });
      
      if (!superadmin) {
        superadmin = await User.create({
          email: 'superadmin@hotelzed.com',
          password: 'SuperAdmin@123',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          isActive: true,
          mustChangePassword: false,
        });
        console.log('✅ Superadmin account created');
      } else {
        // Update existing superadmin password
        superadmin.password = 'SuperAdmin@123';
        await superadmin.save();
        console.log('✅ Superadmin password updated');
      }

      tenant = await Tenant.create({
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        email: 'info@demorestaurant.com',
        description: 'Sample restaurant for testing',
        address: '123 Main Street, New York, NY 10001, USA',
        phone: '+1-555-0123',
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant',
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false,
        },
        isActive: true,
        createdBy: superadmin._id,
      });
      console.log('✅ Demo tenant created');
    }

    // Sample accounts data
    const sampleAccounts = [
      {
        email: 'manager@demorestaurant.com',
        password: 'Manager@123',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        tenantId: tenant._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        email: 'staff1@demorestaurant.com',
        password: 'Staff@123',
        firstName: 'Alice',
        lastName: 'Johnson',
        role: 'staff',
        tenantId: tenant._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        email: 'staff2@demorestaurant.com',
        password: 'Staff@123',
        firstName: 'Bob',
        lastName: 'Williams',
        role: 'staff',
        tenantId: tenant._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        email: 'cashier1@demorestaurant.com',
        password: 'Cashier@123',
        firstName: 'Carol',
        lastName: 'Davis',
        role: 'staff', // Using staff role for cashier functionality
        tenantId: tenant._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        email: 'cashier2@demorestaurant.com',
        password: 'Cashier@123',
        firstName: 'David',
        lastName: 'Miller',
        role: 'staff', // Using staff role for cashier functionality
        tenantId: tenant._id,
        isActive: true,
        mustChangePassword: false,
      },
    ];

    // Create users
    for (const accountData of sampleAccounts) {
      const existingUser = await User.findOne({ email: accountData.email });
      
      if (!existingUser) {
        await User.create(accountData);
        console.log(`✅ Created ${accountData.role} account: ${accountData.email}`);
      } else {
        console.log(`⚠️  User already exists: ${accountData.email}`);
      }
    }

    console.log('\n📋 Sample Accounts Created:');
    console.log('=====================================');
    console.log('\n🔐 SUPERADMIN:');
    console.log('   Email: superadmin@hotelzed.com');
    console.log('   Password: SuperAdmin@123');
    console.log('\n👔 MANAGER:');
    console.log('   Email: manager@demorestaurant.com');
    console.log('   Password: Manager@123');
    console.log('\n👥 STAFF ACCOUNTS:');
    console.log('   Staff 1:');
    console.log('     Email: staff1@demorestaurant.com');
    console.log('     Password: Staff@123');
    console.log('   Staff 2:');
    console.log('     Email: staff2@demorestaurant.com');
    console.log('     Password: Staff@123');
    console.log('\n💵 CASHIER ACCOUNTS:');
    console.log('   Cashier 1:');
    console.log('     Email: cashier1@demorestaurant.com');
    console.log('     Password: Cashier@123');
    console.log('   Cashier 2:');
    console.log('     Email: cashier2@demorestaurant.com');
    console.log('     Password: Cashier@123');
    console.log('=====================================\n');

    console.log('✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedUsers();