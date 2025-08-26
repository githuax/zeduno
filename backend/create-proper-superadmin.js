const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if superadmin already exists
    const existingSuperadmin = await usersCollection.findOne({ 
      email: 'superadmin@hotelzed.com' 
    });
    
    if (existingSuperadmin) {
      console.log('Superadmin already exists:', {
        email: existingSuperadmin.email,
        firstName: existingSuperadmin.firstName,
        lastName: existingSuperadmin.lastName,
        role: existingSuperadmin.role
      });
      
      // Update to ensure it's a superadmin
      await usersCollection.updateOne(
        { email: 'superadmin@hotelzed.com' },
        { 
          $set: { 
            role: 'superadmin',
            isActive: true
          }
        }
      );
      
      console.log('✅ Superadmin role ensured');
    } else {
      // Create new superadmin
      const hashedPassword = await bcrypt.hash('SuperAdmin@2024!', 10);
      
      const superadmin = {
        email: 'superadmin@hotelzed.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'superadmin',
        isActive: true,
        mustChangePassword: false,
        passwordLastChanged: new Date(),
        accountStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(superadmin);
      console.log('✅ Superadmin created successfully');
    }
    
    console.log('\n📋 Superadmin Credentials:');
    console.log('==========================');
    console.log('Email: superadmin@hotelzed.com');
    console.log('Password: SuperAdmin@2024!');
    console.log('Role: superadmin');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\n🔐 This account should be used for:');
    console.log('   - Creating and managing tenants');
    console.log('   - Configuring payment gateways');
    console.log('   - System-wide administration');
    console.log('\n👤 Regular admin accounts (like irungumill@mail.com) should be used for:');
    console.log('   - Managing their specific restaurant/tenant');
    console.log('   - Day-to-day operations');
    console.log('   - Staff management within their tenant');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });