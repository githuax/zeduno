import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const updateTenantName = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find tenant by ID and update name
    const tenantId = '689ef2ca096c875583b4f82f';
    
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { 
        name: 'Irungu Mill Restaurant',
        slug: 'irungu-mill-restaurant'
      },
      { new: true }
    );
    
    if (updatedTenant) {
      console.log('Tenant updated successfully:');
      console.log('Name:', updatedTenant.name);
      console.log('Slug:', updatedTenant.slug);
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

updateTenantName();