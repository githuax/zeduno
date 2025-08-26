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

const checkTenants = async () => {
  try {
    await connectDB();
    
    // Check tenants collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Define a basic tenant schema to check existing data
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const Tenant = mongoose.model('Tenant', tenantSchema);
    
    const tenants = await Tenant.find({}).limit(10);
    console.log(`\nFound ${tenants.length} tenants in the database:`);
    
    tenants.forEach((tenant, index) => {
      console.log(`\n${index + 1}. ${tenant.name || 'No name'}`);
      console.log(`   ID: ${tenant._id}`);
      console.log(`   Email: ${tenant.email || 'No email'}`);
      console.log(`   Slug: ${tenant.slug || 'No slug'}`);
      console.log(`   Plan: ${tenant.plan || 'No plan'}`);
      console.log(`   Status: ${tenant.status || 'No status'}`);
      console.log(`   Max Users: ${tenant.maxUsers || 'Not set'}`);
      console.log(`   Current Users: ${tenant.currentUsers || 'Not set'}`);
      console.log(`   Created By: ${tenant.createdBy || 'Not set'}`);
      console.log(`   Created At: ${tenant.createdAt || 'Not set'}`);
      console.log(`   Is Active: ${tenant.isActive}`);
    });
    
    // Check if there are more tenants
    const totalCount = await Tenant.countDocuments();
    if (totalCount > 10) {
      console.log(`\n... and ${totalCount - 10} more tenants`);
    }
    
    console.log(`\nTotal tenants in database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

checkTenants();