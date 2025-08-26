import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const checkTenantDetails = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get user and their tenant details
    const user = await User.findOne({ email: 'irungumill@mail.com' }).populate('tenantId');
    
    if (user) {
      console.log('User details:');
      console.log('Email:', user.email);
      console.log('TenantId:', user.tenantId);
      console.log('Tenant populated:', user.tenantId);
    } else {
      console.log('User not found');
      return;
    }

    // Get tenant details separately
    const tenant = await Tenant.findById(user.tenantId);
    if (tenant) {
      console.log('\nTenant details:');
      console.log('ID:', tenant._id);
      console.log('Name:', tenant.name);
      console.log('Slug:', tenant.slug);
      console.log('Email:', tenant.email);
    } else {
      console.log('Tenant not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkTenantDetails();