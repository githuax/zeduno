const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkSuperAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant');
    console.log('Connected to MongoDB');
    
    // Check SuperAdmin collection first
    try {
      const { SuperAdmin } = require('./dist/models/SuperAdmin');
      const superAdmin = await SuperAdmin.findOne({ 
        email: 'superadmin@zeduno.com'
      });
      
      if (superAdmin) {
        console.log('Found in SuperAdmin collection');
        console.log('Email:', superAdmin.email);
        
        // Test passwords
        const passwords = ['admin@123', 'Admin@123', 'admin123', 'password123'];
        
        for (const password of passwords) {
          const isValid = await bcrypt.compare(password, superAdmin.password);
          console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        }
        
        // Set a new password
        const newPassword = 'admin@123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        superAdmin.password = hashedPassword;
        await superAdmin.save();
        console.log(`\n✅ Password reset to: ${newPassword}`);
      }
    } catch (error) {
      console.log('SuperAdmin model not found, checking User model...');
    }
    
    // Check User collection
    const { User } = require('./dist/models/User');
    const user = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin'
    });
    
    if (user) {
      console.log('\nFound in User collection');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      
      // Test passwords
      const passwords = ['admin@123', 'Admin@123', 'admin123', 'password123'];
      
      for (const password of passwords) {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      }
      
      // Set a new password
      const newPassword = 'admin@123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      console.log(`\n✅ User password reset to: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkSuperAdminPassword();