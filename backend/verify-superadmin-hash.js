const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifySuperAdminHash() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant');
    console.log('Connected to MongoDB');
    
    const { User } = require('./dist/models/User');
    
    const user = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin'
    });
    
    if (user) {
      console.log('Found superadmin user');
      console.log('Email:', user.email);
      console.log('Password hash:', user.password);
      console.log('Hash length:', user.password.length);
      
      // Test the password directly
      const testPassword = 'admin@123';
      
      // Direct bcrypt test
      const directTest = await bcrypt.compare(testPassword, user.password);
      console.log(`\nDirect bcrypt.compare("${testPassword}"): ${directTest ? '✅ VALID' : '❌ Invalid'}`);
      
      // Test via model method
      const methodTest = await user.comparePassword(testPassword);
      console.log(`Model comparePassword("${testPassword}"): ${methodTest ? '✅ VALID' : '❌ Invalid'}`);
      
      // Create a new hash and compare
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('\nNew hash for "admin@123":', newHash);
      const newHashTest = await bcrypt.compare(testPassword, newHash);
      console.log('New hash test:', newHashTest ? '✅ VALID' : '❌ Invalid');
      
      // Update the password using the model's pre-save hook
      user.password = testPassword;
      await user.save();
      console.log('\n✅ Password updated using model save (will trigger pre-save hook)');
      
      // Test again
      const afterUpdate = await User.findOne({ email: 'superadmin@zeduno.com' });
      const finalTest = await afterUpdate.comparePassword(testPassword);
      console.log(`Final test after update: ${finalTest ? '✅ VALID' : '❌ Invalid'}`);
      
    } else {
      console.log('Superadmin user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifySuperAdminHash();