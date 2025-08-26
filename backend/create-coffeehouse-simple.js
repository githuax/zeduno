const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const tenantsCollection = db.collection('tenants');
    const usersCollection = db.collection('users');
    
    try {
      // Check if tenant already exists
      const existingTenant = await tenantsCollection.findOne({ 
        $or: [{ name: 'The Coffeehouse' }, { email: 'coffeehouse@mail.com' }]
      });
      
      if (existingTenant) {
        console.log('❌ Tenant already exists');
        process.exit(1);
      }
      
      // Create Coffeehouse tenant
      const tenant = {
        name: 'The Coffeehouse',
        email: 'coffeehouse@mail.com',
        slug: 'the-coffeehouse',
        plan: 'basic',
        maxUsers: 10,
        currentUsers: 0,
        status: 'active',
        settings: {
          currency: 'USD',
          businessType: 'restaurant'
        },
        paymentConfig: {
          mpesa: { enabled: false },
          stripe: { enabled: false },
          square: { enabled: false },
          cash: { enabled: true }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const savedTenant = await tenantsCollection.insertOne(tenant);
      console.log('✅ Created tenant:', tenant.name);
      console.log('   Tenant ID:', savedTenant.insertedId);
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: 'coffeehouse@mail.com' });
      if (existingUser) {
        console.log('❌ User already exists');
        process.exit(1);
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Pass@12345', 10);
      
      const adminUser = {
        email: 'coffeehouse@mail.com',
        password: hashedPassword,
        firstName: 'Coffee',
        lastName: 'Admin',
        role: 'admin',
        tenantId: savedTenant.insertedId,
        tenant: savedTenant.insertedId,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(adminUser);
      console.log('✅ Created admin user:', adminUser.email);
      console.log('   Password: Pass@12345');
      console.log('   Role:', adminUser.role);
      console.log('   Active:', adminUser.isActive);
      
      console.log('\n🎉 Coffeehouse setup complete!');
      console.log('You can now login with:');
      console.log('   Email: coffeehouse@mail.com');
      console.log('   Password: Pass@12345');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });