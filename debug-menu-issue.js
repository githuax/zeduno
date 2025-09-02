// Debug script to check menu item creation issue
// Copy and paste this into your browser console

async function debugMenuIssue() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found! Please log in first.');
    return;
  }

  try {
    // Decode the JWT to see user info (client-side decoding, not secure but good for debugging)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const tokenData = JSON.parse(jsonPayload);
    console.log('🔍 Token Data:', tokenData);

    // Check categories
    console.log('\n📁 Fetching categories...');
    const categoriesResponse = await fetch('http://192.168.2.43:8080/api/menu/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Categories response status:', categoriesResponse.status);
    const categoriesData = await categoriesResponse.json();
    console.log('Categories data:', categoriesData);

    if (categoriesData.data && categoriesData.data.length > 0) {
      console.log('\n🏷️ Available categories:');
      categoriesData.data.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (ID: ${cat._id})`);
      });

      // Test creating a menu item with the first category
      const testCategory = categoriesData.data[0];
      console.log(`\n🧪 Testing menu item creation with category: ${testCategory.name} (${testCategory._id})`);
      
      const testMenuItem = {
        name: 'Test Menu Item',
        description: 'This is a test menu item',
        price: 9.99,
        categoryId: testCategory._id,
        isAvailable: true,
        preparationTime: 15,
        tags: ['test'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        spiceLevel: 'mild',
        nutritionalInfo: {}
      };

      console.log('Test menu item data:', testMenuItem);

      const createResponse = await fetch('http://192.168.2.43:8080/api/menu/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMenuItem)
      });

      console.log('\n📝 Create menu item response status:', createResponse.status);
      const createData = await createResponse.json();
      console.log('Create response data:', createData);

      if (!createResponse.ok) {
        console.log('❌ Error creating menu item:', createData.message);
        
        // Additional debugging
        if (createData.message === 'Invalid category or category does not belong to your restaurant') {
          console.log('\n🔍 Debugging category ownership:');
          console.log('Token tenant ID:', tokenData.tenantId);
          console.log('Selected category ID:', testCategory._id);
          console.log('Category object:', testCategory);
        }
      } else {
        console.log('✅ Menu item created successfully!');
      }
    } else {
      console.log('❌ No categories found! Create categories first.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug function
debugMenuIssue();
