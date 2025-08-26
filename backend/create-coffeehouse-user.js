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
      // Find the coffeehouse tenant
      const tenant = await tenantsCollection.findOne({ 
        email: 'coffeehouse@mail.com'
      });
      
      if (!tenant) {
        console.log('❌ Coffeehouse tenant not found');
        process.exit(1);
      }
      
      console.log('✅ Found tenant:', tenant.name);
      console.log('   ID:', tenant._id);
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ 
        email: 'coffeehouse@mail.com' 
      });
      
      if (existingUser) {
        console.log('❌ User already exists with this email');
        // Reset the password for existing user
        const hashedPassword = await bcrypt.hash('Pass@12345', 10);
        await usersCollection.updateOne(
          { email: 'coffeehouse@mail.com' },
          { 
            $set: { 
              password: hashedPassword,
              isActive: true,
              mustChangePassword: false,
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Reset password for existing user');
        console.log('   Email: coffeehouse@mail.com');
        console.log('   New Password: Pass@12345');
        process.exit(0);
      }
      
      // Create admin user for the tenant
      const hashedPassword = await bcrypt.hash('Pass@12345', 10);
      
      const adminUser = {
        email: 'coffeehouse@mail.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Coffee Admin',
        role: 'admin',
        tenantId: tenant._id,
        tenant: tenant._id,
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
      console.log('   Tenant:', tenant.name);
      
      console.log('\n🎉 Coffeehouse user setup complete!');
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