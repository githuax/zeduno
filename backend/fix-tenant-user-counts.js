const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('MongoDB connected to zeduno database successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixUserCounts = async () => {
  try {
    await connectDB();
    
    // Define schemas
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const userSchema = new mongoose.Schema({}, { strict: false });
    
    const Tenant = mongoose.model('Tenant', tenantSchema);
    const User = mongoose.model('User', userSchema);
    
    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants to update\n`);
    
    for (const tenant of tenants) {
      console.log(`=== Fixing ${tenant.name} ===`);
      
      // Count actual active users for this tenant
      const actualUserCount = await User.countDocuments({ 
        tenantId: tenant._id,
        isActive: true 
      });
      
      const oldCount = tenant.currentUsers || 0;
      console.log(`Old count: ${oldCount}`);
      console.log(`Actual count: ${actualUserCount}`);
      
      if (oldCount !== actualUserCount) {
        // Update the tenant's currentUsers count
        await Tenant.updateOne(
          { _id: tenant._id },
          { currentUsers: actualUserCount }
        );
        console.log(`✅ Updated ${tenant.name} from ${oldCount} to ${actualUserCount} users`);
      } else {
        console.log(`✅ ${tenant.name} count is already correct`);
      }
      
      console.log('');
    }
    
    console.log('🎉 All tenant user counts have been synchronized!');
    
    // Verify the changes
    console.log('\n=== Verification ===');
    const updatedTenants = await Tenant.find({}, 'name currentUsers maxUsers');
    updatedTenants.forEach(tenant => {
      console.log(`${tenant.name}: ${tenant.currentUsers}/${tenant.maxUsers} users`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

fixUserCounts();