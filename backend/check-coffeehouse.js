const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Search for any accounts containing 'coffeehouse'
    const coffeeUsers = await usersCollection.find({ 
      email: { $regex: 'coffee', $options: 'i' } 
    }).toArray();
    
    if (coffeeUsers.length > 0) {
      console.log('☕ Found coffee-related accounts:');
      coffeeUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('');
      });
    } else {
      console.log('❌ No coffee-related accounts found');
    }
    
    // Also check for any 'house' accounts
    const houseUsers = await usersCollection.find({ 
      email: { $regex: 'house', $options: 'i' } 
    }).toArray();
    
    if (houseUsers.length > 0) {
      console.log('🏠 Found house-related accounts:');
      houseUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('');
      });
    }

    // Let's also check all admin accounts to see what exists
    console.log('\n📋 All admin accounts:');
    const adminUsers = await usersCollection.find({ role: 'admin' }).toArray();
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   TenantId: ${user.tenantId}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });