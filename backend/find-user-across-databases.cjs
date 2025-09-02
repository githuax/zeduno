const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findUserAcrossDatabases() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        
        console.log('🔍 SEARCHING ALL DATABASES FOR kimathichris15@gmail.com');
        console.log('======================================================');
        console.log('');
        
        // List all databases
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();
        
        console.log('📊 Available databases:');
        databases.databases.forEach(db => {
            console.log(`  • ${db.name}`);
        });
        console.log('');
        
        console.log('🔎 Searching for user in each database...');
        console.log('');
        
        let foundDatabases = [];
        
        for (const database of databases.databases) {
            // Skip system databases
            if (['admin', 'local', 'config'].includes(database.name)) continue;
            
            try {
                const db = client.db(database.name);
                const collections = await db.listCollections().toArray();
                const hasUsersCollection = collections.some(col => col.name === 'users');
                
                if (hasUsersCollection) {
                    const user = await db.collection('users').findOne({ email: 'kimathichris15@gmail.com' });
                    
                    if (user) {
                        console.log(`✅ FOUND in database: ${database.name}`);
                        console.log(`   Email: ${user.email}`);
                        console.log(`   Name: ${user.firstName} ${user.lastName}`);
                        console.log(`   Role: ${user.role}`);
                        console.log(`   TenantId: ${user.tenantId}`);
                        console.log('');
                        
                        foundDatabases.push(database.name);
                    } else {
                        console.log(`❌ Not found in: ${database.name}`);
                    }
                } else {
                    console.log(`⚪ No users collection in: ${database.name}`);
                }
            } catch (error) {
                console.log(`⚠️ Error checking ${database.name}: ${error.message}`);
            }
        }
        
        console.log('');
        console.log('📋 SUMMARY:');
        console.log('============');
        if (foundDatabases.length === 0) {
            console.log('❌ User kimathichris15@gmail.com NOT FOUND in any database');
        } else {
            console.log(`✅ User found in ${foundDatabases.length} database(s):`);
            foundDatabases.forEach(dbName => {
                console.log(`   → ${dbName}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

findUserAcrossDatabases();
