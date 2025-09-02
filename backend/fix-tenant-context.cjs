const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixTenantContext() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        
        console.log('=== Tenant Context Fix ===\n');
        
        // Get the user
        const user = await db.collection('users').findOne({ 
            email: 'kimathichris15@gmail.com' 
        });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('✅ User found:', user.email);
        console.log('Current tenant ID:', user.tenantId);
        
        // Get the tenant
        const tenant = await db.collection('tenants').findOne({ 
            _id: user.tenantId 
        });
        
        if (!tenant) {
            console.log('❌ Tenant not found');
            return;
        }
        
        console.log('✅ Current tenant:', tenant.name);
        console.log('Tenant owner email:', tenant.email);
        
        // The mapping looks correct, so the issue might be:
        // 1. Browser cache/localStorage
        // 2. Frontend code not properly using the tenant context
        
        console.log('\n=== SOLUTION STEPS ===');
        console.log('The database mapping is CORRECT. The issue is likely frontend-related:');
        console.log('');
        console.log('1. Clear browser localStorage:');
        console.log('   - Open browser console');
        console.log('   - Run: localStorage.clear()');
        console.log('   - Refresh page');
        console.log('');
        console.log('2. If issue persists, check if there\'s tenant context caching:');
        console.log('   - Check React Query cache');
        console.log('   - Look for hardcoded tenant data');
        console.log('');
        console.log('3. The correct tenant data should be:');
        console.log(`   - Tenant Name: "${tenant.name}"`);
        console.log(`   - Tenant ID: "${tenant._id}"`);
        console.log(`   - Owner: "${tenant.email}"`);
        
        // Check if the user is actually seeing "Dama's Restaurant"
        const damasTenant = await db.collection('tenants').findOne({ 
            name: "Dama's Restaurant" 
        });
        
        if (damasTenant) {
            console.log('');
            console.log('🚨 IMPORTANT: If you\'re seeing "Dama\'s Restaurant" in the UI,');
            console.log('this suggests the frontend is loading the wrong tenant data.');
            console.log(`Dama's Restaurant ID: ${damasTenant._id}`);
            console.log(`Chris's Restaurant ID: ${tenant._id}`);
            console.log('');
            console.log('Check the browser\'s Network tab to see which tenant ID is being requested.');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixTenantContext();
