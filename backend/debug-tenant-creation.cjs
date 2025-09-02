const mongoose = require('mongoose');

async function debugTenantCreation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Check the MANSA HOTEL tenant details
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenant = await Tenant.findOne({ email: 'charlesmutai@mail.com' });
    
    if (tenant) {
      console.log('✅ Tenant found:');
      console.log('- Name:', tenant.name);
      console.log('- Email:', tenant.email);  
      console.log('- Created at:', tenant.createdAt);
      console.log('- Current users:', tenant.currentUsers);
    }

    // Check if there were any users created around the same time
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const usersAroundTime = await User.find({
      createdAt: {
        $gte: new Date(tenant.createdAt.getTime() - 60000), // 1 minute before
        $lte: new Date(tenant.createdAt.getTime() + 60000)  // 1 minute after
      }
    });

    console.log('\\n📋 Users created around the same time:');
    usersAroundTime.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - ${user.createdAt}`);
    });

    // Check if there's a user with charlesmutai@mail.com at any time
    const charlesUser = await User.findOne({ email: 'charlesmutai@mail.com' });
    if (charlesUser) {
      console.log('\\n✅ Charles user found:');
      console.log('- Created:', charlesUser.createdAt);
      console.log('- Tenant:', charlesUser.tenantId);
    } else {
      console.log('\\n❌ No user found with email charlesmutai@mail.com');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugTenantCreation();
