import { config } from 'dotenv';
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const updateTenantCurrency = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find tenant by ID and update currency to Kenyan Shillings
    const tenantId = '689ef2ca096c875583b4f82f';
    
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { 
        'settings.currency': 'KES',
        'settings.timezone': 'Africa/Nairobi',
        address: 'Nairobi, Kenya',
        phone: '+254-700-123-456',
        contactPerson: 'Irungu Mill'
      },
      { new: true }
    );
    
    if (updatedTenant) {
      console.log('Tenant updated successfully:');
      console.log('Currency:', updatedTenant.settings.currency);
      console.log('Timezone:', updatedTenant.settings.timezone);
      console.log('Address:', updatedTenant.address);
      console.log('Phone:', updatedTenant.phone);
      console.log('Contact Person:', updatedTenant.contactPerson);
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

updateTenantCurrency();