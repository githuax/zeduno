const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all superadmin accounts
    const superadmins = await usersCollection.find({ 
      role: 'superadmin' 
    }).toArray();
    
    console.log('\n📋 All Superadmin Accounts:');
    console.log('===========================\n');
    
    if (superadmins.length === 0) {
      console.log('❌ No superadmin accounts found');
    } else {
      superadmins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
      });
    }
    
    // Also check for the specific email
    const zedunoAdmin = await usersCollection.findOne({ 
      email: 'superadmin@zeduno.com' 
    });
    
    if (zedunoAdmin) {
      console.log('✅ Found superadmin@zeduno.com:');
      console.log(`   Role: ${zedunoAdmin.role}`);
      console.log(`   Active: ${zedunoAdmin.isActive}`);
    } else {
      console.log('⚠️  superadmin@zeduno.com not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });