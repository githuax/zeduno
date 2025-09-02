const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function resetSuperAdminPassword() {
  console.log('🔑 SUPERADMIN PASSWORD RESET');
  console.log('============================\n');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('hotelzed');
    
    // Check for superadmin in different collections
    console.log('🔍 Searching for superadmin accounts...\n');
    
    // Check users collection
    const users = await db.collection('users').find({
      $or: [
        { email: 'superadmin@zeduno.com' },
        { email: 'superadmin@hotelzed.com' },
        { role: 'superadmin' },
        { isSuperAdmin: true }
      ]
    }).toArray();
    
    // Check superadmins collection
    const superadmins = await db.collection('superadmins').find({}).toArray();
    
    console.log(`📊 Found ${users.length} superadmin(s) in 'users' collection`);
    console.log(`📊 Found ${superadmins.length} superadmin(s) in 'superadmins' collection\n`);
    
    // Display current superadmin accounts
    if (users.length > 0) {
      console.log('👑 USERS COLLECTION - Superadmin Accounts:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive !== false}`);
        console.log(`   Created: ${user.createdAt || 'Unknown'}`);
        console.log('');
      });
    }
    
    if (superadmins.length > 0) {
      console.log('👑 SUPERADMINS COLLECTION - Accounts:');
      superadmins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Active: ${admin.isActive !== false}`);
        console.log(`   Created: ${admin.createdAt || 'Unknown'}`);
        console.log('');
      });
    }
    
    if (users.length === 0 && superadmins.length === 0) {
      console.log('❌ No superadmin accounts found!');
      console.log('💡 Creating new superadmin account...\n');
      
      // Create new superadmin
      const newPassword = 'SuperAdmin123!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const superAdmin = {
        username: 'superadmin',
        email: 'superadmin@zeduno.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        permissions: {
          platform: {
            tenantManagement: true,
            userManagement: true,
            systemSettings: true,
            analytics: true,
            billing: true,
          },
        },
        isActive: true,
        isSuperAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Insert into users collection (primary)
      await db.collection('users').insertOne(superAdmin);
      
      console.log('✅ New superadmin created successfully!');
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`🔑 Password: ${newPassword}`);
      
    } else {
      // Reset password for existing superadmin
      console.log('🔧 Resetting password for existing superadmin(s)...\n');
      
      const newPassword = 'SuperAdmin123!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update users collection
      if (users.length > 0) {
        const result = await db.collection('users').updateMany(
          { 
            $or: [
              { email: 'superadmin@zeduno.com' },
              { email: 'superadmin@hotelzed.com' },
              { role: 'superadmin' }
            ]
          },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );
        console.log(`✅ Updated ${result.modifiedCount} superadmin(s) in users collection`);
      }
      
      // Update superadmins collection
      if (superadmins.length > 0) {
        const result2 = await db.collection('superadmins').updateMany(
          {},
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );
        console.log(`✅ Updated ${result2.modifiedCount} superadmin(s) in superadmins collection`);
      }
      
      console.log(`\n🔑 New password set: ${newPassword}`);
    }
    
    console.log('\n📝 CURRENT SUPERADMIN CREDENTIALS:');
    console.log('=================================');
    console.log('📧 Email: superadmin@zeduno.com');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('');
    console.log('🌐 Try logging in at:');
    console.log('🖥️  Frontend: http://localhost:8080');
    console.log('🔧 Backend: http://localhost:5000');
    console.log('');
    console.log('⚠️  If this still doesn\'t work, check:');
    console.log('1. Make sure backend server is running');
    console.log('2. Check if email is exactly: superadmin@zeduno.com');
    console.log('3. Verify database connection is working');
    console.log('4. Try the alternative email: superadmin@hotelzed.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

resetSuperAdminPassword();
