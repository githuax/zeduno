import { config } from 'dotenv';
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const createUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'irungumill@mail.com' });
    if (existingUser) {
      console.log('User irungumill@mail.com already exists');
      return;
    }

    // Find a tenant to assign (use first available tenant)
    const tenant = await Tenant.findOne({});
    if (!tenant) {
      console.log('No tenant found. Creating a demo tenant...');
      
      const newTenant = new Tenant({
        name: 'Irungu Mill Restaurant',
        slug: 'irungu-mill',
        email: 'irungumill@mail.com',
        phone: '+1234567890',
        address: '123 Demo Street, Demo City, DC 12345',
        isActive: true
      });
      
      await newTenant.save();
      console.log('Created tenant:', newTenant.name);
    }

    const tenantToUse = tenant || await Tenant.findOne({});

    // Create the user - let the pre-save middleware handle password hashing
    const user = new User({
      email: 'irungumill@mail.com',
      password: 'Pass@12345', // Will be hashed by pre-save middleware
      firstName: 'Irungu',
      lastName: 'Mill',
      role: 'admin',
      tenantId: tenantToUse!._id,
      isActive: true,
      accountStatus: 'active'
    });

    await user.save();
    console.log('User created successfully!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('TenantId:', user.tenantId);
    console.log('Active:', user.isActive);
    
    // Test the password
    const isPasswordValid = await user.comparePassword('Pass@12345');
    console.log('Password validation test:', isPasswordValid);

    // For viewing in MongoDB Compass
    console.log('\nFor MongoDB Compass:');
    console.log('Password is hashed with bcrypt and stored securely.');
    console.log('You cannot see the plain text password in the database.');
    console.log('Hash starts with:', user.password.substring(0, 10));

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createUser();