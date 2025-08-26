const mongoose = require('mongoose');
require('dotenv').config();

async function updateTenantCurrency() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Tenant schema
    const tenantSchema = new mongoose.Schema({
      name: String,
      settings: {
        currency: String,
        timezone: String,
        language: String,
        businessType: String
      }
    }, { strict: false });
    
    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
    
    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`\nFound ${tenants.length} tenants:\n`);
    
    for (const tenant of tenants) {
      console.log(`Tenant: ${tenant.name}`);
      console.log(`  ID: ${tenant._id}`);
      console.log(`  Current Currency: ${tenant.settings?.currency || 'Not set'}`);
      
      // Update to KES
      if (tenant.settings) {
        tenant.settings.currency = 'KES';
      } else {
        tenant.settings = { currency: 'KES' };
      }
      
      await tenant.save();
      console.log(`  ✅ Updated to: KES\n`);
    }
    
    // Also check if there's a tenant with the specific ID we've been working with
    const specificTenantIds = ['689ef2ca096c875583b4f82f', '689efeb076d2f5c84073c56d'];
    
    for (const tenantId of specificTenantIds) {
      try {
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          console.log(`\nSpecific Tenant Found: ${tenant.name}`);
          console.log(`  Currency: ${tenant.settings?.currency}`);
        }
      } catch (err) {
        // Tenant not found
      }
    }
    
    console.log('\n✅ All tenants updated to use KES currency');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateTenantCurrency();