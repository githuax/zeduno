// Quick API debug script
// You can run this in the browser console to check the API

async function debugAPI() {
  const token = localStorage.getItem('token');
  console.log('Token present:', !!token);
  
  if (!token) {
    console.log('No token found! Please log in first.');
    return;
  }
  
  try {
    // Check categories
    console.log('Fetching categories...');
    const categoriesResponse = await fetch('http://192.168.2.43:8080/api/menu/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Categories response status:', categoriesResponse.status);
    const categoriesData = await categoriesResponse.json();
    console.log('Categories data:', categoriesData);
    
    if (categoriesData.data && categoriesData.data.length === 0) {
      console.log('⚠️  No categories found! You need to create categories first.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug
debugAPI();
