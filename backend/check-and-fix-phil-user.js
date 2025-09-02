const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixPhilUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant');
    console.log('Connected to MongoDB');
    
    const { User } = require('./dist/models/User');
    const { Tenant } = require('./dist/models/Tenant');
    
    // Find Phil user
    const philUser = await User.findOne({ email: 'phil@mail.com' });
    
    if (philUser) {
      console.log('\n✅ Found Phil user:');
      console.log('  ID:', philUser._id);
      console.log('  Email:', philUser.email);
      console.log('  Name:', philUser.firstName, philUser.lastName);
      console.log('  Role:', philUser.role);
      console.log('  Tenant ID:', philUser.tenantId);
      console.log('  Tenant Name:', philUser.tenantName);
      console.log('  Is Active:', philUser.isActive);
      console.log('  Must Change Password:', philUser.mustChangePassword);
      console.log('  Account Status:', philUser.accountStatus);
      
      // Get tenant info
      if (philUser.tenantId) {
        const tenant = await Tenant.findById(philUser.tenantId);
        if (tenant) {
          console.log('\n📋 Tenant Information:');
          console.log('  Tenant Name:', tenant.name);
          console.log('  Tenant Email:', tenant.email);
          console.log('  Tenant Status:', tenant.status);
          
          // Update tenantName if missing
          if (!philUser.tenantName || philUser.tenantName !== tenant.name) {
            philUser.tenantName = tenant.name;
            console.log('  ✅ Updated tenantName to:', tenant.name);
          }
        }
      }
      
      // Set the default password for newly created tenant admins
      const defaultPassword = 'restaurant123';
      philUser.password = defaultPassword;  // Will be hashed by pre-save hook
      philUser.mustChangePassword = true;   // Force password change on first login
      philUser.isActive = true;              // Ensure account is active
      philUser.accountStatus = 'active';     // Ensure account status is active
      
      await philUser.save();
      
      console.log('\n✅ Phil user has been fixed:');
      console.log('  Password reset to:', defaultPassword);
      console.log('  Must change password:', true);
      console.log('  Account is active:', true);
      console.log('\n📝 Phil can now login with:');
      console.log('  Email: phil@mail.com');
      console.log('  Password: restaurant123');
      console.log('  ⚠️  Will be prompted to change password on first login');
      
    } else {
      console.log('\n❌ Phil user not found (phil@mail.com)');
      
      // Check if there's a tenant for Phil
      const philTenant = await Tenant.findOne({ 
        $or: [
          { email: 'phil@mail.com' },
          { contactPerson: { $regex: /phil/i } }
        ]
      });
      
      if (philTenant) {
        console.log('\n📋 Found Phil tenant:', philTenant.name);
        console.log('  Creating admin user for this tenant...');
        
        // Create Phil user
        const nameParts = (philTenant.contactPerson || 'Phil User').split(' ');
        const firstName = nameParts[0] || 'Phil';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        const newPhilUser = new User({
          email: 'phil@mail.com',
          firstName: firstName,
          lastName: lastName,
          role: 'admin',
          password: 'restaurant123',  // Will be hashed by pre-save hook
          tenantId: philTenant._id,
          tenantName: philTenant.name,
          isActive: true,
          mustChangePassword: true,
          accountStatus: 'active',
          passwordLastChanged: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newPhilUser.save();
        console.log('\n✅ Created Phil admin user');
        console.log('  Email: phil@mail.com');
        console.log('  Password: restaurant123');
        console.log('  Role: admin');
        console.log('  Tenant:', philTenant.name);
      } else {
        console.log('\n❌ No tenant found for Phil');
        console.log('  Please create a tenant first through the superadmin interface');
      }
    }
    
    // List all users to verify
    console.log('\n📋 All users in database:');
    const allUsers = await User.find({})
      .select('email firstName lastName role tenantName isActive mustChangePassword')
      .sort({ email: 1 });
    
    allUsers.forEach(u => {
      const mustChange = u.mustChangePassword ? '⚠️ MUST CHANGE' : '✅';
      console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | ${u.role} | ${u.tenantName || 'No Tenant'} | ${mustChange}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAndFixPhilUser();