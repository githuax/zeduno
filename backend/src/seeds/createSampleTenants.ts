import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import dotenv from 'dotenv';

dotenv.config();

const createSampleTenants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Sample tenants data
    const sampleTenants = [
      {
        name: 'The Grand Restaurant',
        slug: 'grand-restaurant',
        email: 'info@grandrestaurant.com',
        domain: 'grandrestaurant.com',
        description: 'Fine dining restaurant with modern cuisine',
        address: '123 Main Street, New York, NY 10001, USA',
        phone: '+1-555-0123',
        contactPerson: 'John Smith',
        plan: 'premium',
        status: 'active',
        maxUsers: 50,
        currentUsers: 15,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant' as const,
        },
        subscription: {
          plan: 'premium' as const,
          status: 'active' as const,
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
      },
      {
        name: 'Pizza Palace',
        slug: 'pizza-palace',
        email: 'contact@pizzapalace.com',
        domain: 'pizzapalace.com',
        description: 'Authentic Italian pizzeria',
        address: '456 Oak Avenue, Los Angeles, CA 90001, USA',
        phone: '+1-555-0456',
        contactPerson: 'Maria Rossi',
        plan: 'basic',
        status: 'active',
        maxUsers: 20,
        currentUsers: 8,
        settings: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant' as const,
        },
        subscription: {
          plan: 'basic' as const,
          status: 'active' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false,
        },
        isActive: true,
      },
      {
        name: 'Sushi Express',
        slug: 'sushi-express',
        email: 'admin@sushiexpress.com',
        domain: 'sushiexpress.com',
        description: 'Japanese restaurant and takeaway',
        address: '789 Elm Street, San Francisco, CA 94101, USA',
        phone: '+1-555-0789',
        contactPerson: 'Takeshi Yamamoto',
        plan: 'premium',
        status: 'active',
        maxUsers: 30,
        currentUsers: 5,
        settings: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant' as const,
        },
        subscription: {
          plan: 'premium' as const,
          status: 'active' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false,
        },
        isActive: true,
      },
      {
        name: 'Burger House',
        slug: 'burger-house',
        email: 'info@burgerhouse.com',
        domain: 'burgerhouse.com',
        description: 'American diner and burger restaurant',
        address: '321 Pine Road, Chicago, IL 60601, USA',
        phone: '+1-555-0321',
        contactPerson: 'Mike Johnson',
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        currentUsers: 25,
        settings: {
          timezone: 'America/Chicago',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant' as const,
        },
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false,
        },
        isActive: true,
      },
    ];

    // Create or update tenants
    for (const tenantData of sampleTenants) {
      const existingTenant = await Tenant.findOne({ slug: tenantData.slug });
      
      if (!existingTenant) {
        await Tenant.create(tenantData);
        console.log(`✅ Created tenant: ${tenantData.name}`);
      } else {
        await Tenant.updateOne({ slug: tenantData.slug }, tenantData);
        console.log(`✅ Updated tenant: ${tenantData.name}`);
      }
    }

    console.log('\n✅ Sample tenants created/updated successfully!');
    console.log('\n📋 Tenants Created:');
    console.log('=====================================');
    for (const tenant of sampleTenants) {
      console.log(`\n🏢 ${tenant.name}`);
      console.log(`   Domain: ${tenant.domain}`);
      console.log(`   Plan: ${tenant.plan}`);
      console.log(`   Status: ${tenant.status}`);
    }
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('❌ Error creating sample tenants:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
createSampleTenants();