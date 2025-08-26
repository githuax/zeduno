const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Tenant schema
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  domain: { type: String, trim: true },
  plan: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  maxUsers: { type: Number, default: 10 },
  currentUsers: { type: Number, default: 0 },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  description: { type: String, trim: true },
  settings: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    businessType: { type: String, enum: ['restaurant', 'hotel', 'both'], default: 'restaurant' }
  },
  subscription: {
    plan: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    startDate: Date,
    endDate: Date
  },
  features: {
    dineIn: { type: Boolean, default: true },
    takeaway: { type: Boolean, default: true },
    delivery: { type: Boolean, default: true },
    roomService: { type: Boolean, default: false },
    hotelBooking: { type: Boolean, default: false }
  },
  paymentConfig: {
    mpesa: {
      enabled: { type: Boolean, default: false },
      businessShortCode: { type: String, default: '' },
      passkey: { type: String, default: '' },
      environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      accountType: { type: String, enum: ['till', 'paybill'], default: 'till' }
    },
    stripe: {
      enabled: { type: Boolean, default: false }
    },
    cash: {
      enabled: { type: Boolean, default: true }
    }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const createSampleTenants = async () => {
  try {
    await connectDB();
    
    const Tenant = mongoose.model('Tenant', tenantSchema);
    
    // Check if tenants already exist
    const existingCount = await Tenant.countDocuments();
    console.log(`Found ${existingCount} existing tenants`);
    
    if (existingCount > 0) {
      console.log('Sample tenants already exist. Listing existing tenants:');
      const tenants = await Tenant.find({}, 'name email plan status maxUsers currentUsers').limit(10);
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.email}) - ${tenant.plan} - ${tenant.status} - Users: ${tenant.currentUsers}/${tenant.maxUsers}`);
      });
      return;
    }
    
    // Create sample tenants
    const sampleTenants = [
      {
        name: "Joe's Pizza Palace",
        slug: "joes-pizza-palace",
        email: "admin@joespizzapalace.com",
        domain: "joespizza.zeduno.com",
        plan: "premium",
        status: "active",
        maxUsers: 25,
        currentUsers: 8,
        address: "123 Main Street, Downtown",
        phone: "+1-555-0123",
        contactPerson: "Joe Smith",
        description: "Authentic Italian pizza restaurant serving the community since 1985",
        settings: {
          timezone: "America/New_York",
          currency: "USD",
          language: "en",
          businessType: "restaurant"
        },
        subscription: {
          plan: "premium",
          status: "active",
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false
        }
      },
      {
        name: "Sunset Grill & Bar",
        slug: "sunset-grill-bar",
        email: "manager@sunsetgrill.com",
        plan: "basic",
        status: "active",
        maxUsers: 15,
        currentUsers: 5,
        address: "456 Beach Boulevard, Coastal City",
        phone: "+1-555-0456",
        contactPerson: "Maria Garcia",
        description: "Oceanfront dining with fresh seafood and stunning sunset views",
        settings: {
          timezone: "America/Los_Angeles",
          currency: "USD",
          language: "en",
          businessType: "restaurant"
        }
      },
      {
        name: "Grand Plaza Hotel",
        slug: "grand-plaza-hotel",
        email: "reservations@grandplaza.com",
        domain: "grandplaza.zeduno.com",
        plan: "enterprise",
        status: "active",
        maxUsers: 100,
        currentUsers: 45,
        address: "789 Executive Avenue, Business District",
        phone: "+1-555-0789",
        contactPerson: "David Chen",
        description: "Luxury 5-star hotel with fine dining and conference facilities",
        settings: {
          timezone: "America/New_York",
          currency: "USD",
          language: "en",
          businessType: "both"
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: false,
          roomService: true,
          hotelBooking: true
        }
      },
      {
        name: "Mama's Home Kitchen",
        slug: "mamas-home-kitchen",
        email: "info@mamaskitchen.com",
        plan: "basic",
        status: "active",
        maxUsers: 10,
        currentUsers: 3,
        address: "321 Family Street, Suburbia",
        phone: "+1-555-0321",
        contactPerson: "Sarah Johnson",
        description: "Family-style comfort food restaurant with homemade recipes",
        settings: {
          timezone: "America/Chicago",
          currency: "USD",
          language: "en",
          businessType: "restaurant"
        }
      },
      {
        name: "Tokyo Sushi Express",
        slug: "tokyo-sushi-express",
        email: "orders@tokyosushi.com",
        plan: "premium",
        status: "suspended",
        maxUsers: 20,
        currentUsers: 2,
        address: "555 Bamboo Lane, Asia Town",
        phone: "+1-555-0555",
        contactPerson: "Hiroshi Tanaka",
        description: "Fast-casual sushi restaurant with fresh ingredients and quick service",
        settings: {
          timezone: "America/Los_Angeles",
          currency: "USD",
          language: "en",
          businessType: "restaurant"
        }
      }
    ];
    
    // Get the superadmin user ID to set as creator
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String
    }));
    
    const superAdmin = await User.findOne({ email: 'superadmin@zeduno.com' });
    
    // Add createdBy to all tenants
    sampleTenants.forEach(tenant => {
      if (superAdmin) {
        tenant.createdBy = superAdmin._id;
      }
    });
    
    // Insert tenants
    const createdTenants = await Tenant.insertMany(sampleTenants);
    
    console.log(`✅ Successfully created ${createdTenants.length} sample tenants:`);
    console.log('');
    
    createdTenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   📧 Email: ${tenant.email}`);
      console.log(`   📱 Plan: ${tenant.plan.toUpperCase()}`);
      console.log(`   🔧 Status: ${tenant.status.toUpperCase()}`);
      console.log(`   👥 Users: ${tenant.currentUsers}/${tenant.maxUsers}`);
      console.log(`   🌐 Slug: ${tenant.slug}`);
      console.log('');
    });
    
    console.log('🎉 Sample tenants created successfully!');
    console.log('🌐 You can now view them in your SuperAdmin Dashboard at: http://localhost:8081/superadmin/dashboard');
    
  } catch (error) {
    console.error('❌ Error creating sample tenants:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createSampleTenants();