const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugUserTenantMapping() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        
        console.log('=== User-Tenant Mapping Debug ===\n');
        
        // Check for the specific user
        const user = await db.collection('users').findOne({ 
            email: 'kimathichris15@gmail.com' 
        });
        
        if (!user) {
            console.log('❌ User not found: kimathichris15@gmail.com');
            
            // Check what users exist
            console.log('\n=== All users in database ===');
            const allUsers = await db.collection('users').find({}).toArray();
            allUsers.forEach(u => {
                console.log(`Email: ${u.email}, TenantId: ${u.tenantId}, Role: ${u.role}`);
            });
            
            return;
        }
        
        console.log('✅ User found:');
        console.log('Email:', user.email);
        console.log('Name:', user.firstName, user.lastName);
        console.log('Role:', user.role);
        console.log('TenantId:', user.tenantId);
        console.log('User ID:', user._id);
        console.log();
        
        // Check the tenant
        if (user.tenantId) {
            const tenant = await db.collection('tenants').findOne({ 
                _id: user.tenantId 
            });
            
            if (tenant) {
                console.log('✅ Tenant found:');
                console.log('Tenant ID:', tenant._id);
                console.log('Tenant Name:', tenant.name);
                console.log('Owner Email:', tenant.email);
                console.log('Created At:', tenant.createdAt);
                console.log();
                
                // Check if user should be associated with this tenant
                if (tenant.email === 'dama@mail.com' && user.email === 'kimathichris15@gmail.com') {
                    console.log('🚨 PROBLEM IDENTIFIED:');
                    console.log('User kimathichris15@gmail.com is mapped to tenant owned by dama@mail.com');
                    console.log('This is likely the root cause of the issue!');
                    console.log();
                    
                    // Check if there's a tenant for kimathichris15@gmail.com
                    const correctTenant = await db.collection('tenants').findOne({ 
                        email: 'kimathichris15@gmail.com' 
                    });
                    
                    if (correctTenant) {
                        console.log('✅ Found correct tenant for user:');
                        console.log('Correct Tenant ID:', correctTenant._id);
                        console.log('Correct Tenant Name:', correctTenant.name);
                        console.log();
                        console.log('🔧 SOLUTION: Update user.tenantId to:', correctTenant._id);
                        
                        // Ask if user wants to fix it
                        console.log('\nTo fix this issue, run:');
                        console.log(`db.users.updateOne(
                            { email: "kimathichris15@gmail.com" },
                            { $set: { tenantId: "${correctTenant._id}" } }
                        )`);
                    } else {
                        console.log('❌ No tenant found for kimathichris15@gmail.com');
                        console.log('You may need to create a tenant for this user');
                    }
                }
            } else {
                console.log('❌ Tenant not found for ID:', user.tenantId);
            }
        } else {
            console.log('❌ User has no tenantId assigned');
        }
        
        // Show all tenants for context
        console.log('\n=== All tenants in database ===');
        const allTenants = await db.collection('tenants').find({}).toArray();
        allTenants.forEach(t => {
            console.log(`Name: "${t.name}", Email: ${t.email}, ID: ${t._id}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

debugUserTenantMapping();
