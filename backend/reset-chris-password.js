const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetChrisPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant');
    console.log('Connected to MongoDB');
    
    const { User } = require('./dist/models/User');
    
    const chrisUser = await User.findOne({ 
      email: 'chris@mail.com'
    });
    
    if (chrisUser) {
      console.log('Found Chris user');
      console.log('Email:', chrisUser.email);
      console.log('Current role:', chrisUser.role);
      console.log('Tenant ID:', chrisUser.tenantId);
      console.log('Tenant Name:', chrisUser.tenantName);
      
      // Set the default password
      const defaultPassword = 'restaurant123';
      chrisUser.password = defaultPassword;  // Will be hashed by pre-save hook
      chrisUser.mustChangePassword = true;  // Force password change on first login
      await chrisUser.save();
      
      console.log(`\n✅ Password reset to: ${defaultPassword}`);
      console.log('✅ Must change password flag set to: true');
      console.log('\nThe user can now login with:');
      console.log('Email: chris@mail.com');
      console.log('Password: restaurant123');
      console.log('\nThey will be prompted to change the password on first login.');
    } else {
      console.log('❌ Chris user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

resetChrisPassword();