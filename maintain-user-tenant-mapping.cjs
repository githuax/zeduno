#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Maintenance script to verify and preserve current user-tenant mappings
 * Run this periodically to ensure user-tenant relationships remain correct
 */

async function maintainUserTenantMapping() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        
        console.log('🔧 USER-TENANT MAPPING MAINTENANCE\n');
        
        // Current working mappings to preserve
        const correctMappings = [
            {
                userEmail: 'kimathichris15@gmail.com',
                expectedTenantId: '68aea29a35e54afb735f483c',
                expectedTenantName: "Chris's Restaurant",
                password: 'password123'
            }
        ];
        
        console.log('✅ VERIFYING CURRENT WORKING MAPPINGS:\n');
        
        for (const mapping of correctMappings) {
            const user = await db.collection('users').findOne({ email: mapping.userEmail });
            
            if (!user) {
                console.log(`❌ User not found: ${mapping.userEmail}`);
                continue;
            }
            
            const tenant = await db.collection('tenants').findOne({ _id: user.tenantId });
            
            if (!tenant) {
                console.log(`❌ Tenant not found for user: ${mapping.userEmail}`);
                continue;
            }
            
            const isCorrect = user.tenantId.toString() === mapping.expectedTenantId && 
                             tenant.name === mapping.expectedTenantName;
            
            if (isCorrect) {
                console.log(`✅ ${mapping.userEmail}`);
                console.log(`   → Tenant: "${tenant.name}"`);
                console.log(`   → Tenant ID: ${tenant._id}`);
                console.log(`   → Status: CORRECT MAPPING MAINTAINED\n`);
            } else {
                console.log(`🚨 ${mapping.userEmail}`);
                console.log(`   → Current Tenant: "${tenant.name}" (ID: ${tenant._id})`);
                console.log(`   → Expected Tenant: "${mapping.expectedTenantName}" (ID: ${mapping.expectedTenantId})`);
                console.log(`   → Status: MAPPING INCORRECT - NEEDS FIXING\n`);
                
                // Provide fix command
                const correctTenant = await db.collection('tenants').findOne({ 
                    _id: new require('mongodb').ObjectId(mapping.expectedTenantId) 
                });
                
                if (correctTenant) {
                    console.log(`   → Fix command:`);
                    console.log(`     db.users.updateOne(`);
                    console.log(`       { email: "${mapping.userEmail}" },`);
                    console.log(`       { $set: { tenantId: ObjectId("${mapping.expectedTenantId}") } }`);
                    console.log(`     )\n`);
                }
            }
        }
        
        // Show all current mappings for reference
        console.log('📋 CURRENT USER-TENANT MAPPINGS:\n');
        const users = await db.collection('users').find({}).toArray();
        
        for (const user of users) {
            if (user.tenantId) {
                const tenant = await db.collection('tenants').findOne({ _id: user.tenantId });
                console.log(`👤 ${user.email}`);
                console.log(`   → Tenant: "${tenant?.name || 'NOT FOUND'}" (${user.tenantId})`);
                console.log(`   → Role: ${user.role}`);
                console.log();
            }
        }
        
        console.log('🔐 LOGIN CREDENTIALS (WORKING):');
        correctMappings.forEach(mapping => {
            console.log(`📧 ${mapping.userEmail}`);
            console.log(`🔑 ${mapping.password}`);
            console.log(`🏢 ${mapping.expectedTenantName}\n`);
        });
        
    } catch (error) {
        console.error('❌ Maintenance error:', error);
    } finally {
        await client.close();
    }
}

// Run maintenance check
maintainUserTenantMapping();
