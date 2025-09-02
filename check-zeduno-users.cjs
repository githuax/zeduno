const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkZedunoUsers() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('zeduno'); // Explicitly use zeduno database
        
        console.log('📋 ZEDUNO DATABASE - USER VERIFICATION:');
        console.log('=====================================');
        console.log('');
        console.log('🔗 Connected to:', process.env.MONGODB_URI || 'mongodb://localhost:27017');
        console.log('📂 Database: zeduno');
        console.log('');
        
        // Count users
        const userCount = await db.collection('users').countDocuments();
        console.log('👤 Total users in database:', userCount);
        console.log('');
        
        if (userCount === 2) {
            console.log('✅ PERFECT: Database has exactly 2 users as expected');
        } else if (userCount < 2) {
            console.log('⚠️ FEWER THAN EXPECTED: Database has', userCount, 'users (expected 2)');
        } else {
            console.log('🚨 MORE THAN EXPECTED: Database has', userCount, 'users (expected 2)');
        }
        console.log('');
        
        // List all users
        const users = await db.collection('users').find({}, {
            projection: { email: 1, firstName: 1, lastName: 1, role: 1, tenantId: 1 }
        }).toArray();
        
        console.log('📝 ALL USERS IN ZEDUNO DATABASE:');
        console.log('=================================');
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
            console.log(`   Role: ${user.role || 'N/A'}`);
            console.log(`   TenantId: ${user.tenantId || 'N/A'}`);
            console.log('');
        });
        
        // Verify specific expected users
        console.log('🎯 EXPECTED USERS VERIFICATION:');
        console.log('===============================');
        
        const expectedUsers = [
            'kimathichris15@gmail.com',
            // Add the second expected user email here if you know it
        ];
        
        for (const email of expectedUsers) {
            const user = await db.collection('users').findOne({ email });
            if (user) {
                console.log(`✅ Found expected user: ${email}`);
            } else {
                console.log(`❌ Missing expected user: ${email}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkZedunoUsers();
