const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLoginResponse() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        
        console.log('=== Testing Login API Response ===\n');
        
        // Simulate what the login API does
        const email = 'kimathichris15@gmail.com';
        
        // Find user (same as login API)
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('✅ User found in database:');
        console.log('- Email:', user.email);
        console.log('- User ID:', user._id);
        console.log('- Role:', user.role);
        console.log('- TenantId:', user.tenantId);
        console.log();
        
        // Find tenant (same as login API)
        const tenant = await db.collection('tenants').findOne({ _id: user.tenantId });
        
        if (!tenant) {
            console.log('❌ Tenant not found');
            return;
        }
        
        console.log('✅ Tenant found in database:');
        console.log('- Tenant ID:', tenant._id);
        console.log('- Tenant Name:', tenant.name);
        console.log('- Owner Email:', tenant.email);
        console.log();
        
        // Simulate the response that login API should return
        const loginResponse = {
            user: {
                _id: user._id,
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenantId: user.tenantId,
                tenantName: tenant.name,
                tenant: {
                    _id: tenant._id,
                    id: tenant._id,
                    name: tenant.name,
                    email: tenant.email,
                    settings: tenant.settings || {}
                },
                permissions: user.permissions || []
            },
            token: 'dummy-token-for-testing'
        };
        
        console.log('🔍 Expected Login API Response:');
        console.log(JSON.stringify(loginResponse, null, 2));
        
        // Check if there are any issues with the expected response
        console.log('\n=== Verification ===');
        console.log('✅ user.email:', loginResponse.user.email);
        console.log('✅ user.tenantId:', loginResponse.user.tenantId);
        console.log('✅ user.tenantName:', loginResponse.user.tenantName);
        console.log('✅ user.tenant.name:', loginResponse.user.tenant.name);
        
        if (loginResponse.user.tenant.name === "Chris's Restaurant") {
            console.log('\n✅ EXPECTED RESULT: Should show "Chris\'s Restaurant"');
        } else {
            console.log('\n❌ UNEXPECTED: This should be "Chris\'s Restaurant"');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

testLoginResponse();
