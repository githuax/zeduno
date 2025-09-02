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

const checkTenants = async () => {
  try {
    await connectDB();
    
    // Get the tenants collection directly
    const db = mongoose.connection.db;
    const tenantsCollection = db.collection('tenants');
    
    console.log('🏢 Checking tenants in zeduno database...\n');
    
    // Count total tenants
    const totalTenants = await tenantsCollection.countDocuments();
    console.log(`📊 Total tenants: ${totalTenants}`);
    
    if (totalTenants > 0) {
      // Get all tenants
      const allTenants = await tenantsCollection.find({}).toArray();
      
      console.log('\n🏢 TENANT LIST:');
      console.log('================');
      allTenants.forEach((tenant, index) => {
        console.log(`${index + 1}. Name: ${tenant.name}`);
        console.log(`   ID: ${tenant._id}`);
        console.log(`   Status: ${tenant.status || 'N/A'}`);
        console.log(`   Created: ${tenant.createdAt || 'N/A'}`);
        console.log(`   Currency: ${tenant.currency || 'N/A'}`);
        console.log('   ---');
      });
    } else {
      console.log('\n❌ No tenants found in the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
};

checkTenants();
