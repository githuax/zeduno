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

const checkTipsyBearUser = async () => {
  try {
    await connectDB();
    
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);
    
    // Check for tipsybear users
    console.log('=== Searching for TipsyBear users ===');
    const tipsyBearUsers = await User.find({
      $or: [
        { email: /tipsybear/i },
        { email: 'admin@tipsybear.com' }
      ]
    });
    
    if (tipsyBearUsers.length === 0) {
      console.log('❌ No users found with tipsybear email');
    } else {
      console.log(`Found ${tipsyBearUsers.length} TipsyBear user(s):`);
      tipsyBearUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Tenant: ${user.tenantId}`);
        console.log(`   Password hash (first 20): ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
        console.log('');
      });
    }
    
    // Check if TipsyBear tenant exists
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const Tenant = mongoose.model('Tenant', tenantSchema);
    
    const tipsyBearTenant = await Tenant.findOne({
      $or: [
        { name: /tipsy.*bear/i },
        { email: /tipsybear/i },
        { slug: /tipsybear/i }
      ]
    });
    
    if (tipsyBearTenant) {
      console.log('=== TipsyBear Tenant Found ===');
      console.log(`Name: ${tipsyBearTenant.name}`);
      console.log(`Email: ${tipsyBearTenant.email}`);
      console.log(`ID: ${tipsyBearTenant._id}`);
      console.log(`Status: ${tipsyBearTenant.status}`);
      console.log(`Active: ${tipsyBearTenant.isActive}`);
    } else {
      console.log('❌ No TipsyBear tenant found');
    }
    
    // List all users to see what's available
    console.log('\n=== All Users (first 10) ===');
    const allUsers = await User.find({}, 'email firstName lastName role isActive tenantId').limit(10);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

checkTipsyBearUser();