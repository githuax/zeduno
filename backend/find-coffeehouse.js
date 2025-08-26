const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const tenantsCollection = db.collection('tenants');
    const usersCollection = db.collection('users');
    
    // Check for coffeehouse tenant
    const tenant = await tenantsCollection.findOne({ 
      $or: [
        { name: { $regex: 'coffee', $options: 'i' } },
        { email: 'coffeehouse@mail.com' }
      ]
    });
    
    if (tenant) {
      console.log('✅ Found existing tenant:');
      console.log('   Name:', tenant.name);
      console.log('   Email:', tenant.email);
      console.log('   ID:', tenant._id);
      console.log('   Status:', tenant.status);
      
      // Check for the user
      const user = await usersCollection.findOne({ 
        tenantId: tenant._id,
        email: 'coffeehouse@mail.com'
      });
      
      if (user) {
        console.log('✅ Found user for tenant:');
        console.log('   Email:', user.email);
        console.log('   Name:', user.firstName, user.lastName);
        console.log('   Role:', user.role);
        console.log('   Active:', user.isActive);
        console.log('   Has Password:', user.password ? 'Yes' : 'No');
      } else {
        console.log('❌ No user found for this tenant');
      }
    } else {
      console.log('❌ No coffeehouse tenant found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });