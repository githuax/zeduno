import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import dotenv from 'dotenv';

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
        
        // Generate unique email to avoid conflicts
        const emailSuffix = user?.firstName?.toLowerCase() || 'tenant';
        const tenantEmail = `admin-${emailSuffix}@${slug}.com`;
        
        const tenantData = {
          _id: new mongoose.Types.ObjectId(tenantId as string),
          name: tenantName,
          slug: slug,
          email: tenantEmail, // Use unique email
          plan: 'basic' as const,
          status: 'active' as const,
          maxUsers: 10,
          currentUsers: 1,
          settings: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessType: 'restaurant' as const
          },
          subscription: {
            plan: 'basic' as const,
            status: 'active' as const,
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
              environment: 'sandbox' as const
            }
          },
          isActive: true
        };
        
        try {
          await Tenant.create(tenantData);
          console.log(`✅ Created tenant record: ${tenantName} (${tenantId}) with email: ${tenantEmail}`);
        } catch (createError: any) {
          if (createError.code === 11000) {
            // Duplicate key error, try with a different email
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            tenantData.email = `admin-${emailSuffix}-${randomSuffix}@${slug}.com`;
            await Tenant.create(tenantData);
            console.log(`✅ Created tenant record with alternate email: ${tenantName} (${tenantId}) - ${tenantData.email}`);
          } else {
            throw createError;
          }
        }
      } else {
        console.log(`✓ Tenant already exists: ${existingTenant.name} (${tenantId})`);
      }
    }

    // List all tenants
    const allTenants = await Tenant.find({});
    console.log('\n🏢 All tenants:');
    allTenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.email}) - ID: ${tenant._id}`);
    });

    console.log('\n✅ Tenant records setup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTenantRecords();
