const mongoose = require('mongoose');
require('dotenv').config();

async function fixChrisTenantName() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    const { Tenant } = require('./dist/models/Tenant');
    const { User } = require('./dist/models/User');
    
    // Find Chris user
    const chrisUser = await User.findOne({ email: 'chris@mail.com' });
    
    if (chrisUser) {
      console.log('Found Chris user:', chrisUser.email);
      console.log('Current tenantName:', chrisUser.tenantName);
      console.log('Current tenantId:', chrisUser.tenantId);
      
      // Find the tenant
      const tenant = await Tenant.findById(chrisUser.tenantId);
      
      if (tenant) {
        console.log('Found tenant:', tenant.name);
        
        // Update the user with the correct tenant name
        chrisUser.tenantName = tenant.name;
        await chrisUser.save();
        
        console.log('✅ Updated Chris user with tenant name:', tenant.name);
      } else {
        console.log('❌ Tenant not found for ID:', chrisUser.tenantId);
      }
    } else {
      console.log('❌ Chris user not found');
    }
    
    // Also fix any other users with missing tenantName
    console.log('\nChecking for other users with missing tenantName...');
    const usersWithTenant = await User.find({ 
      tenantId: { $exists: true, $ne: null },
      $or: [
        { tenantName: { $exists: false } },
        { tenantName: null },
        { tenantName: '' }
      ]
    });
    
    if (usersWithTenant.length > 0) {
      console.log(`Found ${usersWithTenant.length} users with missing tenantName`);
      
      for (const user of usersWithTenant) {
        const tenant = await Tenant.findById(user.tenantId);
        if (tenant) {
          user.tenantName = tenant.name;
          await user.save();
          console.log(`✅ Fixed ${user.email} - set tenantName to: ${tenant.name}`);
        }
      }
    } else {
      console.log('No users found with missing tenantName');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixChrisTenantName();