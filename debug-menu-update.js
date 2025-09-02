// Debug script to test menu item update
const axios = require('axios');

// Get token from localStorage simulation or use a test token
const baseURL = 'http://localhost:3000/api';

async function testMenuUpdate() {
  try {
    // First, let's get a menu item to update
    const menuResponse = await axios.get(`${baseURL}/menu/items`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    if (menuResponse.data.data && menuResponse.data.data.length > 0) {
      const firstItem = menuResponse.data.data[0];
      console.log('Found menu item to test:', firstItem.name, firstItem._id);
      
      // Try updating it
      const updateData = {
        name: firstItem.name,
        price: firstItem.price,
        description: firstItem.description,
        spiceLevel: firstItem.spiceLevel || "none"
      };
      
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await axios.put(`${baseURL}/menu/items/${firstItem._id}`, updateData, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update successful:', updateResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// For now just show the structure - user needs to add real token
console.log('Please update the token in the script and run: node debug-menu-update.js');
