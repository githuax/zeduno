const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const tenantsCollection = db.collection('tenants');
    const usersCollection = db.collection('users');
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
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
      
      const savedTenant = await tenantsCollection.insertOne(tenant, { session });
      console.log('✅ Created tenant:', tenant.name);
      
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
      
      await usersCollection.insertOne(adminUser, { session });
      console.log('✅ Created admin user:', adminUser.email);
      console.log('   Password: Pass@12345');
      
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');
      
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error:', error);
    } finally {
      session.endSession();
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });