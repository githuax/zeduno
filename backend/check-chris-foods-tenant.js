const mongoose = require('mongoose');
require('dotenv').config();

async function checkChrisFoodsTenant() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno-multi-tenant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check for Chris Foods tenant
    const { Tenant } = require('./dist/models/Tenant');
    const { User } = require('./dist/models/User');
    
    // Look for the tenant
    const chrisTenant = await Tenant.findOne({ 
      $or: [
        { name: { $regex: /chris foods/i } },
        { email: 'chris@mail.com' }
      ]
    });
    
    if (chrisTenant) {
      console.log('\n✅ Chris Foods Tenant Found:');
      console.log('ID:', chrisTenant._id);
      console.log('Name:', chrisTenant.name);
      console.log('Email:', chrisTenant.email);
      console.log('Slug:', chrisTenant.slug);
      console.log('Status:', chrisTenant.status);
      console.log('Created By:', chrisTenant.createdBy);
      console.log('Created At:', chrisTenant.createdAt);
      
      // Check for the user
      const chrisUser = await User.findOne({ email: 'chris@mail.com' });
      
      if (chrisUser) {
        console.log('\n✅ Chris User Found:');
        console.log('ID:', chrisUser._id);
        console.log('Email:', chrisUser.email);
        console.log('Name:', chrisUser.firstName, chrisUser.lastName);
        console.log('Role:', chrisUser.role);
        console.log('Tenant ID:', chrisUser.tenantId);
        console.log('Tenant Name:', chrisUser.tenantName);
        console.log('Is Active:', chrisUser.isActive);
        console.log('Account Status:', chrisUser.accountStatus);
        
        // Verify tenant association
        if (chrisUser.tenantId) {
          const userTenant = await Tenant.findById(chrisUser.tenantId);
          console.log('\n🔗 Tenant Association:');
          console.log('User is linked to tenant:', userTenant ? userTenant.name : 'NOT FOUND');
          
          if (!userTenant || userTenant._id.toString() !== chrisTenant._id.toString()) {
            console.log('⚠️  WARNING: User tenant ID does not match Chris Foods tenant!');
          }
        } else {
          console.log('\n⚠️  WARNING: User has no tenantId set!');
        }
      } else {
        console.log('\n❌ Chris User NOT Found (chris@mail.com)');
      }
      
      // Check all users for this tenant
      console.log('\n📋 All users for Chris Foods tenant:');
      const tenantUsers = await User.find({ 
        $or: [
          { tenantId: chrisTenant._id },
          { tenantName: chrisTenant.name }
        ]
      });
      
      if (tenantUsers.length > 0) {
        tenantUsers.forEach(u => {
          console.log(`- ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`);
        });
      } else {
        console.log('No users found for this tenant ID');
      }
      
    } else {
      console.log('\n❌ Chris Foods Tenant NOT Found');
      
      // List all tenants
      const allTenants = await Tenant.find({});
      console.log('\n📋 All Tenants in Database:');
      allTenants.forEach(t => {
        console.log(`- ${t.name} (${t.email}) - Status: ${t.status}`);
      });
    }
    
    // Check if user exists without tenant
    const chrisUserAny = await User.findOne({ email: 'chris@mail.com' });
    if (chrisUserAny && !chrisTenant) {
      console.log('\n⚠️  User exists but tenant does not!');
      console.log('User details:', {
        email: chrisUserAny.email,
        name: `${chrisUserAny.firstName} ${chrisUserAny.lastName}`,
        tenantId: chrisUserAny.tenantId,
        tenantName: chrisUserAny.tenantName
      });
    }
    
    // Check all users to debug
    console.log('\n📋 All Users in Database:');
    const allUsers = await User.find({}).select('email firstName lastName role tenantId tenantName isActive');
    allUsers.forEach(u => {
      console.log(`- ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}, Tenant: ${u.tenantName || 'None'}, Active: ${u.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkChrisFoodsTenant();