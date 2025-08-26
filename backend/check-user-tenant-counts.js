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

const checkUserCounts = async () => {
  try {
    await connectDB();
    
    // Define schemas
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const userSchema = new mongoose.Schema({}, { strict: false });
    
    const Tenant = mongoose.model('Tenant', tenantSchema);
    const User = mongoose.model('User', userSchema);
    
    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants\n`);
    
    for (const tenant of tenants) {
      console.log(`=== ${tenant.name} ===`);
      console.log(`ID: ${tenant._id}`);
      console.log(`Email: ${tenant.email}`);
      console.log(`Current Users (stored): ${tenant.currentUsers || 'Not set'}`);
      console.log(`Max Users: ${tenant.maxUsers}`);
      
      // Count actual users for this tenant
      const actualUserCount = await User.countDocuments({ 
        tenantId: tenant._id,
        isActive: true 
      });
      console.log(`Actual Active Users: ${actualUserCount}`);
      
      // List the users
      const users = await User.find({ 
        tenantId: tenant._id 
      }, 'email firstName lastName role isActive');
      
      console.log(`Users for this tenant:`);
      if (users.length === 0) {
        console.log('  - No users found');
      } else {
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - Active: ${user.isActive}`);
        });
      }
      
      // Check if count needs updating
      if (tenant.currentUsers !== actualUserCount) {
        console.log(`❌ MISMATCH: Stored count (${tenant.currentUsers}) != Actual count (${actualUserCount})`);
      } else {
        console.log(`✅ Count is correct`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Also check for users without tenantId
    const usersWithoutTenant = await User.find({ 
      $or: [
        { tenantId: { $exists: false } },
        { tenantId: null }
      ]
    }, 'email firstName lastName role');
    
    if (usersWithoutTenant.length > 0) {
      console.log('=== Users without tenant assignment ===');
      usersWithoutTenant.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

checkUserCounts();