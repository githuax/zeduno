const fetch = require('node-fetch');

// Test the menu update with different spiceLevel values
const baseURL = 'http://localhost:3000/api';

async function testSpiceLevelValidation() {
  console.log('Testing spiceLevel validation...');
  
  const testCases = [
    { spiceLevel: "" },  // Empty string - should fail
    { spiceLevel: "none" },  // Valid value
    { spiceLevel: "mild" },  // Valid value
    { spiceLevel: "invalid" },  // Invalid value - should fail
    {},  // No spiceLevel - should be OK (optional field)
  ];
  
  for (let testCase of testCases) {
    console.log(`\nTesting with spiceLevel: "${testCase.spiceLevel || 'undefined'}"`);
    
    const requestData = {
      name: "Test Item",
      description: "Test description",
      price: 10.50,
      ...testCase
    };
    
    try {
      const response = await fetch(`${baseURL}/menu/items/test-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'  // This will fail auth but we want to see validation first
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.text();
      console.log(`Status: ${response.status}, Response: ${result}`);
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

console.log('This is a test script to understand spiceLevel validation');
console.log('The actual fix should be in the EditMenuItemForm.tsx file');
