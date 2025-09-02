const axios = require('axios');

// Configuration for different restaurant examples
const RESTAURANT_TEMPLATES = {
  'mama-lucys': {
    name: "Mama Lucy's Kitchen",
    email: 'info@mamalucys.com',
    slug: 'mama-lucys-kitchen',
    plan: 'premium',
    address: '123 Kimathi Street, Nairobi, Kenya',
    phone: '+254722123456',
    contactPerson: 'Lucy Wanjiku',
    description: 'Authentic Kenyan cuisine restaurant in the heart of Nairobi',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      language: 'en',
      businessType: 'restaurant'
    },
    mpesa: {
      accountType: 'till',
      tillNumber: '123456',
      businessShortCode: '174379'
    }
  },
  'java-house': {
    name: 'Java House Westlands',
    email: 'westlands@javahouse.co.ke',
    slug: 'java-house-westlands',
    plan: 'enterprise',
    address: 'Westlands Square, Nairobi, Kenya',
    phone: '+254733456789',
    contactPerson: 'John Mwangi',
    description: 'Premium coffee and continental cuisine',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      language: 'en',
      businessType: 'restaurant'
    },
    mpesa: {
      accountType: 'paybill',
      paybillNumber: '654321',
      businessShortCode: '400200'
    }
  }
};

async function setupTenantWithMPesa(restaurantKey = 'mama-lucys') {
  console.log('🚀 Setting up tenant with M-Pesa configuration...\n');
  
  const template = RESTAURANT_TEMPLATES[restaurantKey];
  if (!template) {
    console.log('❌ Invalid restaurant template. Available options:', Object.keys(RESTAURANT_TEMPLATES));
    return;
  }
  
  try {
    // Step 1: Login as superadmin
    console.log('1️⃣ Logging in as superadmin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@zeduno.com',
      password: 'SuperAdmin@123'
    });
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Logged in successfully\n');
    
    // Step 2: Create the tenant
    console.log('2️⃣ Creating tenant:', template.name);
    const tenantData = {
      name: template.name,
      email: template.email,
      slug: template.slug,
      plan: template.plan,
      maxUsers: template.plan === 'enterprise' ? 50 : template.plan === 'premium' ? 20 : 10,
      address: template.address,
      phone: template.phone,
      contactPerson: template.contactPerson,
      description: template.description,
      settings: template.settings,
      features: {
        dineIn: true,
        takeaway: true,
        delivery: true,
        roomService: template.plan === 'enterprise',
        hotelBooking: false
      }
    };
    
    let tenant;
    try {
      const tenantResponse = await axios.post('http://localhost:5000/api/superadmin/tenants', tenantData, { headers });
      tenant = tenantResponse.data;
      console.log('✅ Tenant created successfully:', tenant.name);
      console.log('🆔 Tenant ID:', tenant._id);
    } catch (error) {
      if (error.response?.data?.error?.includes('duplicate') || error.response?.data?.error?.includes('exists')) {
        console.log('📋 Tenant already exists, fetching existing tenant...');
        const existingResponse = await axios.get('http://localhost:5000/api/superadmin/tenants', { headers });
        const tenants = existingResponse.data.tenants || existingResponse.data || [];
        tenant = tenants.find(t => t.slug === template.slug || t.email === template.email);
        
        if (tenant) {
          console.log('✅ Found existing tenant:', tenant.name);
          console.log('🆔 Tenant ID:', tenant._id);
        } else {
          throw new Error('Could not find or create tenant');
        }
      } else {
        throw error;
      }
    }
    
    console.log('');
    
    // Step 3: Configure M-Pesa for the tenant
    console.log('3️⃣ Configuring M-Pesa payment gateway...');
    const mpesaConfig = {
      paymentConfig: {
        mpesa: {
          enabled: true,
          environment: 'sandbox', // Change to 'production' for live
          accountType: template.mpesa.accountType,
          tillNumber: template.mpesa.tillNumber || '',
          paybillNumber: template.mpesa.paybillNumber || '',
          businessShortCode: template.mpesa.businessShortCode,
          passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Sandbox passkey
          consumerKey: process.env.MPESA_CONSUMER_KEY || 'your-consumer-key-here',
          consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret-here'
        },
        stripe: {
          enabled: false,
          publicKey: '',
          secretKey: '',
          webhookSecret: ''
        },
        square: {
          enabled: false,
          applicationId: '',
          accessToken: ''
        },
        cash: {
          enabled: true
        }
      }
    };
    
    await axios.put(`http://localhost:5000/api/payments/config/${tenant._id}`, mpesaConfig, { headers });
    console.log('✅ M-Pesa configuration saved successfully\n');
    
    // Step 4: Verify the configuration
    console.log('4️⃣ Verifying payment configuration...');
    const verifyResponse = await axios.get(`http://localhost:5000/api/payments/config/${tenant._id}`, { headers });
    console.log('✅ Payment configuration verified:');
    console.log('   - M-Pesa Enabled:', verifyResponse.data.mpesa.enabled);
    console.log('   - Account Type:', verifyResponse.data.mpesa.accountType);
    console.log('   - Account Number:', verifyResponse.data.mpesa.tillNumber || verifyResponse.data.mpesa.paybillNumber);
    console.log('   - Business Short Code:', verifyResponse.data.mpesa.businessShortCode);
    console.log('   - Environment:', verifyResponse.data.mpesa.environment);
    console.log('');
    
    // Step 5: Test available payment methods
    console.log('5️⃣ Testing available payment methods...');
    const methodsResponse = await axios.get(`http://localhost:5000/api/payments/methods/${tenant._id}`, { headers });
    console.log('✅ Available payment methods:');
    methodsResponse.data.forEach(method => {
      console.log(`   - ${method.name} (${method.provider})`);
      if (method.accountInfo) {
        console.log(`     Account: ${method.accountInfo.type} ${method.accountInfo.number}`);
      }
    });
    console.log('');
    
    // Step 6: Create admin user for this tenant
    console.log('6️⃣ Creating admin user for the tenant...');
    const adminUserData = {
      email: template.email.replace('info@', 'admin@'),
      password: 'Admin@123456',
      firstName: template.contactPerson.split(' ')[0],
      lastName: template.contactPerson.split(' ').slice(1).join(' '),
      role: 'admin',
      tenantId: tenant._id,
      isActive: true
    };
    
    try {
      await axios.post('http://localhost:5000/api/superadmin/users', adminUserData, { headers });
      console.log('✅ Admin user created successfully');
      console.log('📧 Admin Email:', adminUserData.email);
      console.log('🔐 Admin Password:', adminUserData.password);
      console.log('⚠️  Please change the password after first login\n');
    } catch (error) {
      if (error.response?.data?.error?.includes('duplicate') || error.response?.data?.error?.includes('exists')) {
        console.log('📋 Admin user already exists\n');
      } else {
        console.log('⚠️  Failed to create admin user:', error.response?.data?.error || error.message);
        console.log('   You can create one manually later\n');
      }
    }
    
    // Step 7: Show summary
    console.log('🎉 SETUP COMPLETE! 🎉');
    console.log('========================');
    console.log('🏢 Tenant Name:', template.name);
    console.log('🆔 Tenant ID:', tenant._id);
    console.log('📧 Admin Email:', adminUserData.email);
    console.log('🔐 Admin Password:', adminUserData.password);
    console.log('💳 M-Pesa Status: Enabled');
    console.log('🏦 Account Type:', template.mpesa.accountType);
    console.log('🔢 Account Number:', template.mpesa.tillNumber || template.mpesa.paybillNumber);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Login to the admin panel with the credentials above');
    console.log('2. Update M-Pesa credentials with real Safaricom API keys');
    console.log('3. Test payment flow with a real phone number');
    console.log('4. Set environment to "production" for live transactions');
    console.log('');
    
    return {
      tenant,
      adminCredentials: {
        email: adminUserData.email,
        password: adminUserData.password
      }
    };
    
  } catch (error) {
    console.log('❌ Setup failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.log('Validation errors:', error.response.data.errors);
    }
  }
}

// Function to list all tenants and their M-Pesa status
async function listTenantsWithMPesaStatus() {
  console.log('📋 Listing all tenants and their M-Pesa status...\n');
  
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@zeduno.com',
      password: 'SuperAdmin@123'
    });
    
    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };
    
    const tenantsResponse = await axios.get('http://localhost:5000/api/superadmin/tenants', { headers });
    const tenants = tenantsResponse.data.tenants || tenantsResponse.data || [];
    
    console.log(`Found ${tenants.length} tenant(s):\n`);
    
    for (const tenant of tenants) {
      console.log(`🏢 ${tenant.name}`);
      console.log(`   ID: ${tenant._id}`);
      console.log(`   Email: ${tenant.email}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Plan: ${tenant.plan}`);
      
      try {
        const configResponse = await axios.get(`http://localhost:5000/api/payments/config/${tenant._id}`, { headers });
        const mpesa = configResponse.data.mpesa;
        console.log(`   💳 M-Pesa: ${mpesa.enabled ? '✅ Enabled' : '❌ Disabled'}`);
        if (mpesa.enabled) {
          console.log(`      Account: ${mpesa.accountType} ${mpesa.tillNumber || mpesa.paybillNumber}`);
          console.log(`      Environment: ${mpesa.environment}`);
        }
      } catch (error) {
        console.log(`   💳 M-Pesa: ❓ Unknown (config error)`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.log('❌ Failed to list tenants:', error.response?.data || error.message);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  const restaurantKey = process.argv[3];
  
  switch (command) {
    case 'create':
      setupTenantWithMPesa(restaurantKey);
      break;
    case 'list':
      listTenantsWithMPesaStatus();
      break;
    case 'templates':
      console.log('Available restaurant templates:');
      Object.keys(RESTAURANT_TEMPLATES).forEach(key => {
        const template = RESTAURANT_TEMPLATES[key];
        console.log(`  ${key}: ${template.name} (${template.mpesa.accountType})`);
      });
      break;
    default:
      console.log('🏢 Tenant Setup with M-Pesa Configuration');
      console.log('==========================================');
      console.log('');
      console.log('Commands:');
      console.log('  node setup-tenant-with-mpesa.cjs create [template]  - Create a new tenant');
      console.log('  node setup-tenant-with-mpesa.cjs list               - List all tenants');
      console.log('  node setup-tenant-with-mpesa.cjs templates          - Show available templates');
      console.log('');
      console.log('Examples:');
      console.log('  node setup-tenant-with-mpesa.cjs create mama-lucys');
      console.log('  node setup-tenant-with-mpesa.cjs create java-house');
      console.log('  node setup-tenant-with-mpesa.cjs list');
  }
}

module.exports = { setupTenantWithMPesa, listTenantsWithMPesaStatus, RESTAURANT_TEMPLATES };