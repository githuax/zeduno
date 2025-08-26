// Test script to verify table release protection
const token = 'mock-token'; // Since we're using mock auth

async function testTableReleaseProtection() {
  console.log('🧪 Testing table release protection...\n');
  
  try {
    // Get occupied tables
    const tablesResponse = await fetch('http://localhost:3008/api/tables?status=occupied', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tables = await tablesResponse.json();
    
    console.log(`Found ${tables.length} occupied tables`);
    
    if (tables.length === 0) {
      console.log('❌ No occupied tables to test with');
      return;
    }
    
    const testTable = tables[0];
    console.log(`Testing with table: ${testTable.tableNumber} (ID: ${testTable._id})`);
    
    // Try to release the table
    const releaseResponse = await fetch(`http://localhost:3008/api/tables/${testTable._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'available' })
    });
    
    if (releaseResponse.ok) {
      console.log('❌ ERROR: Table was released despite having incomplete orders!');
    } else {
      const errorData = await releaseResponse.json();
      console.log('✅ SUCCESS: Table release was blocked!');
      console.log(`   Message: ${errorData.message}`);
      if (errorData.details) {
        console.log(`   Order: ${errorData.details.orderNumber}`);
        console.log(`   Customer: ${errorData.details.customerName}`);
        console.log(`   Status: ${errorData.details.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testTableReleaseProtection();