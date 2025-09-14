import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

dotenv.config();

const createSlug = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const createTenantRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Get all users with their tenant IDs
    const users = await User.find({}).select('email firstName lastName tenantId role');
    console.log(`Found ${users.length} users`);

    const tenantIds = new Set();
    users.forEach(user => {
      if (user.tenantId) {
        tenantIds.add(user.tenantId.toString());
      }
    });

    console.log(`Found ${tenantIds.size} unique tenant IDs`);

    // Create Tenant records for each unique tenantId
    for (const tenantId of Array.from(tenantIds)) {
      const existingTenant = await Tenant.findById(tenantId);
      
      if (!existingTenant) {
        // Find the first user with this tenantId to get a name
        const user = users.find(u => u.tenantId?.toString() === tenantId);
        const tenantName = user ? `${user.firstName}'s Restaurant` : 'Unknown Restaurant';
        const slug = createSlug(tenantName);
        
        await Tenant.create({
          _id: new mongoose.Types.ObjectId(tenantId as string),
          name: tenantName,
          slug: slug,
          email: user?.email || 'unknown@example.com',
          plan: 'basic',
          status: 'active',
          maxUsers: 10,
          currentUsers: 1,
          settings: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessType: 'restaurant'
          },
          subscription: {
            plan: 'basic',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          paymentConfig: {
            mpesa: {
              enabled: false,
              consumerKey: '',
              consumerSecret: '',
              businessShortcode: '',
              passkey: '',
              environment: 'sandbox'
            }
          },
          isActive: true
        });
        
        console.log(`✅ Created tenant record: ${tenantName} (${tenantId})`);
      } else {
        console.log(`✓ Tenant already exists: ${existingTenant.name} (${tenantId})`);
      }
    }

    // List all tenants
    const allTenants = await Tenant.find({});
    console.log('\n🏢 All tenants:');
    allTenants.forEach(tenant => {
      console.log(`- ${tenant.name} (ID: ${tenant._id})`);
    });

    console.log('\n✅ Tenant records setup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTenantRecords();
