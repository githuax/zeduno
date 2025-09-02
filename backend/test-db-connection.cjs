const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    console.log('DB Name:', process.env.DB_NAME);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        const user = await db.collection('users').findOne({ email: 'kimathichris15@gmail.com' });
        console.log('User found:', !!user);
        if (user) {
            console.log('User tenant ID:', user.tenantId);
            const tenant = await db.collection('tenants').findOne({ _id: user.tenantId });
            console.log('Tenant found:', !!tenant);
            if (tenant) {
                console.log('Tenant name:', tenant.name);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

testConnection();
