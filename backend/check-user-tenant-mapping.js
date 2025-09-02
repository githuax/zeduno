const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkUserTenantMapping = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const tenantsCollection = db.collection('tenants');
    
    console.log('👥 USER-TENANT MAPPING:');
    console.log('========================\n');
    
    const users = await usersCollection.find({}).toArray();
    
    for (const user of users) {
      console.log(`📧 User: ${user.email} (${user.firstName} ${user.lastName})`);
      console.log(`🔑 Role: ${user.role}`);
      
      if (user.tenantId) {
        const tenant = await tenantsCollection.findOne({ _id: user.tenantId });
        if (tenant) {
          console.log(`🏢 Tenant: ${tenant.name} (ID: ${tenant._id})`);
        } else {
          console.log(`🏢 Tenant: ID ${user.tenantId} (NOT FOUND)`);
        }
      } else {
        console.log(`🏢 Tenant: None assigned`);
      }
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
};

checkUserTenantMapping();
