// Simple authentication script for development
// Run this in browser console to authenticate and fix the dashboard stats issue

async function authenticate() {
  console.log('🔐 Starting authentication process...');
  
  try {
    // Try to login with demo credentials
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123'
      })
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Authentication successful!');
      console.log('👤 User:', data.user);
      console.log('🔑 Token saved to localStorage');
      
      // Test the dashboard stats API
      console.log('🧪 Testing dashboard stats API...');
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Dashboard stats working:', statsData.stats);
        console.log('🎉 All fixed! Refresh the page to see the dashboard.');
      } else {
        console.error('❌ Dashboard stats still failing:', statsResponse.status);
      }
      
    } else {
      console.error('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
  }
}

// Run the authentication
authenticate();
