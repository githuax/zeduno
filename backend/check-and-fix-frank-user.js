const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixFrankUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant');
    console.log('Connected to MongoDB');
    
    const { User } = require('./dist/models/User');
    const { Tenant } = require('./dist/models/Tenant');
    
    // Find Frank user
    const frankUser = await User.findOne({ email: 'frank@mail.com' });
    
    if (frankUser) {
      console.log('\n✅ Found Frank user:');
      console.log('  ID:', frankUser._id);
      console.log('  Email:', frankUser.email);
      console.log('  Name:', frankUser.firstName, frankUser.lastName);
      console.log('  Role:', frankUser.role);
      console.log('  Tenant ID:', frankUser.tenantId);
      console.log('  Tenant Name:', frankUser.tenantName);
      console.log('  Is Active:', frankUser.isActive);
      console.log('  Must Change Password:', frankUser.mustChangePassword);
      console.log('  Account Status:', frankUser.accountStatus);
      
      // Get tenant info
      if (frankUser.tenantId) {
        const tenant = await Tenant.findById(frankUser.tenantId);
        if (tenant) {
          console.log('\n📋 Tenant Information:');
          console.log('  Tenant Name:', tenant.name);
          console.log('  Tenant Email:', tenant.email);
          console.log('  Tenant Status:', tenant.status);
          
          // Update tenantName if missing
          if (!frankUser.tenantName || frankUser.tenantName !== tenant.name) {
            frankUser.tenantName = tenant.name;
            console.log('  ✅ Updated tenantName to:', tenant.name);
          }
        }
      }
      
      // Set the default password for newly created tenant admins
      const defaultPassword = 'restaurant123';
      frankUser.password = defaultPassword;  // Will be hashed by pre-save hook
      frankUser.mustChangePassword = true;   // Force password change on first login
      frankUser.isActive = true;              // Ensure account is active
      frankUser.accountStatus = 'active';     // Ensure account status is active
      
      await frankUser.save();
      
      console.log('\n✅ Frank user has been fixed:');
      console.log('  Password reset to:', defaultPassword);
      console.log('  Must change password:', true);
      console.log('  Account is active:', true);
      console.log('\n📝 Frank can now login with:');
      console.log('  Email: frank@mail.com');
      console.log('  Password: restaurant123');
      console.log('  ⚠️  Will be prompted to change password on first login');
      
    } else {
      console.log('\n❌ Frank user not found (frank@mail.com)');
      
      // Check if there's a tenant for Frank
      const frankTenant = await Tenant.findOne({ 
        $or: [
          { email: 'frank@mail.com' },
          { contactPerson: { $regex: /frank/i } }
        ]
      });
      
      if (frankTenant) {
        console.log('\n📋 Found Frank tenant:', frankTenant.name);
        console.log('  Creating admin user for this tenant...');
        
        // Create Frank user
        const nameParts = (frankTenant.contactPerson || 'Frank User').split(' ');
        const firstName = nameParts[0] || 'Frank';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        const newFrankUser = new User({
          email: 'frank@mail.com',
          firstName: firstName,
          lastName: lastName,
          role: 'admin',
          password: 'restaurant123',  // Will be hashed by pre-save hook
          tenantId: frankTenant._id,
          tenantName: frankTenant.name,
          isActive: true,
          mustChangePassword: true,
          accountStatus: 'active',
          passwordLastChanged: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newFrankUser.save();
        console.log('\n✅ Created Frank admin user');
        console.log('  Email: frank@mail.com');
        console.log('  Password: restaurant123');
        console.log('  Role: admin');
        console.log('  Tenant:', frankTenant.name);
      } else {
        console.log('\n❌ No tenant found for Frank');
        console.log('  Please create a tenant first through the superadmin interface');
      }
    }
    
    // Test the password after fix
    console.log('\n🧪 Testing password after fix...');
    const testUser = await User.findOne({ email: 'frank@mail.com' });
    if (testUser) {
      const isPasswordValid = await testUser.comparePassword('restaurant123');
      console.log('Password test result:', isPasswordValid ? '✅ VALID' : '❌ Still invalid');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAndFixFrankUser();