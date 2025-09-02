// Debug payment methods in browser console
// Open your browser, go to Console, and run this:

console.log('🔍 Debugging Payment Methods');
console.log('============================');

// Check tenant context
const tenantData = localStorage.getItem('tenant');
const userData = localStorage.getItem('user');
const token = localStorage.getItem('token');

console.log('1. Checking Authentication & Tenant Data:');
console.log('Token exists:', !!token);
console.log('User exists:', !!userData);
console.log('Tenant exists:', !!tenantData);

if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('User tenant ID:', user.tenantId);
    console.log('User role:', user.role);
  } catch (e) {
    console.log('Error parsing user data:', e);
  }
}

if (tenantData) {
  try {
    const tenant = JSON.parse(tenantData);
    console.log('Tenant ID:', tenant._id);
    console.log('Tenant name:', tenant.name);
  } catch (e) {
    console.log('Error parsing tenant data:', e);
  }
}

// Test API call directly
async function testPaymentMethods() {
  if (!token) {
    console.log('❌ No token available for API test');
    return;
  }

  let tenantId;
  if (userData) {
    try {
      const user = JSON.parse(userData);
      tenantId = user.tenantId;
    } catch (e) {
      console.log('Error getting tenant ID from user:', e);
      return;
    }
  }

  if (!tenantId) {
    console.log('❌ No tenant ID available');
    return;
  }

  console.log('\n2. Testing API Call:');
  console.log('Endpoint:', `/api/payments/methods/${tenantId}`);

  try {
    const response = await fetch(`/api/payments/methods/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Payment methods response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 Available Payment Methods:');
        data.forEach((method, index) => {
          console.log(`${index + 1}. ${method.name} (${method.provider}) - ${method.isEnabled ? 'Enabled' : 'Disabled'}`);
        });
      } else {
        console.log('⚠️ No payment methods returned or empty array');
      }
    } else {
      const errorData = await response.text();
      console.log('❌ API Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

// Test tenant API call
async function testTenantData() {
  if (!token) return;

  console.log('\n3. Testing Tenant API:');
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current user data:', data);
    } else {
      console.log('❌ Auth check failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Auth check error:', error);
  }
}

// Run all tests
testPaymentMethods();
testTenantData();

console.log('\n💡 If no payment methods are showing:');
console.log('1. Make sure you are logged in');
console.log('2. Check tenant configuration');
console.log('3. Verify M-Pesa is enabled for your tenant');
console.log('4. Check backend server logs');
