const axios = require('axios');

async function debugTableCreation() {
  console.log('🔍 Debugging Table Creation Issue');
  console.log('==================================\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Attempting login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dama@mail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test different table creation scenarios
    console.log('\n2️⃣ Testing table creation scenarios...');

    // Scenario 1: Minimal valid table
    const minimalTable = {
      tableNumber: 'TEST-001',
      capacity: 4,
      section: 'Main',
      floor: 1
    };

    console.log('\n📋 Scenario 1: Minimal Valid Table');
    console.log('Data:', JSON.stringify(minimalTable, null, 2));
    
    try {
      const response1 = await axios.post('http://localhost:5000/api/tables', minimalTable, { headers });
      console.log('✅ Success:', response1.data);
      
      // Clean up - delete the test table
      await axios.delete(`http://localhost:5000/api/tables/${response1.data._id}`, { headers });
      console.log('🧹 Test table cleaned up');
    } catch (error1) {
      console.log('❌ Failed:', error1.response?.data || error1.message);
      console.log('   Status:', error1.response?.status);
      console.log('   Headers:', error1.response?.headers);
    }

    // Scenario 2: Table with position
    const tableWithPosition = {
      tableNumber: 'TEST-002',
      capacity: 6,
      section: 'VIP',
      floor: 2,
      position: { x: 100, y: 200 }
    };

    console.log('\n📋 Scenario 2: Table with Position');
    console.log('Data:', JSON.stringify(tableWithPosition, null, 2));
    
    try {
      const response2 = await axios.post('http://localhost:5000/api/tables', tableWithPosition, { headers });
      console.log('✅ Success:', response2.data);
      
      // Clean up
      await axios.delete(`http://localhost:5000/api/tables/${response2.data._id}`, { headers });
      console.log('🧹 Test table cleaned up');
    } catch (error2) {
      console.log('❌ Failed:', error2.response?.data || error2.message);
      console.log('   Status:', error2.response?.status);
    }

    // Scenario 3: Invalid data (to see validation errors)
    const invalidTable = {
      tableNumber: '',  // Empty table number
      capacity: -1,     // Invalid capacity
      // Missing required section
    };

    console.log('\n📋 Scenario 3: Invalid Data (Expected to Fail)');
    console.log('Data:', JSON.stringify(invalidTable, null, 2));
    
    try {
      const response3 = await axios.post('http://localhost:5000/api/tables', invalidTable, { headers });
      console.log('⚠️ Unexpected success:', response3.data);
    } catch (error3) {
      console.log('✅ Expected validation error:', error3.response?.data || error3.message);
      console.log('   Status:', error3.response?.status);
    }

    // Step 3: Check existing tables
    console.log('\n3️⃣ Checking existing tables...');
    try {
      const tablesResponse = await axios.get('http://localhost:5000/api/tables', { headers });
      console.log(`✅ Found ${tablesResponse.data.length} existing tables`);
      tablesResponse.data.slice(0, 3).forEach((table, index) => {
        console.log(`   ${index + 1}. Table ${table.tableNumber} - ${table.capacity} seats - ${table.status}`);
      });
    } catch (tablesError) {
      console.log('❌ Could not fetch tables:', tablesError.response?.data || tablesError.message);
    }

    console.log('\n🎯 Common Issues & Solutions:');
    console.log('=============================');
    console.log('1. ❌ 401 Unauthorized → Login expired, need to re-authenticate');
    console.log('2. ❌ 400 Bad Request → Missing required fields (tableNumber, capacity, section)');
    console.log('3. ❌ 409 Conflict → Table number already exists for this tenant');
    console.log('4. ❌ 403 Forbidden → User role insufficient (need admin role)');
    console.log('5. ❌ 500 Server Error → Database connection or server issue');

  } catch (error) {
    console.log('❌ Debug test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n🔐 Authentication Issue Detected');
      console.log('================================');
      console.log('• The login credentials might be incorrect');
      console.log('• Try logging in through the frontend first');
      console.log('• Check if the user has admin privileges');
    }
  }
}

// Function to test a specific table creation
async function testSpecificTable(tableData) {
  console.log('\n🧪 Testing Specific Table Creation');
  console.log('==================================');
  console.log('Table data:', JSON.stringify(tableData, null, 2));

  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dama@mail.com',
      password: 'password123'
    });

    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post('http://localhost:5000/api/tables', tableData, { headers });
    console.log('✅ Table created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Table creation failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
    
    // Provide specific help based on error
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    if (status === 401) {
      console.log('\n💡 Solution: Authentication issue');
      console.log('   • Login to frontend first');
      console.log('   • Check if token is valid');
    } else if (status === 400) {
      console.log('\n💡 Solution: Validation issue');
      console.log('   • Required fields: tableNumber, capacity, section');
      console.log('   • Capacity must be > 0');
      console.log('   • TableNumber must be unique');
    } else if (status === 403) {
      console.log('\n💡 Solution: Permission issue');
      console.log('   • User must have admin role');
      console.log('   • Current user role:', loginResponse.data.user.role);
    }
    
    return null;
  }
}

// Run the debug
debugTableCreation();

// Export for manual testing
module.exports = { testSpecificTable };
