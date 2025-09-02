// Debug authentication in browser console
// Open your browser (http://192.168.2.43:8080), go to Console, and run this:

console.log('=== Authentication Debug ===');

// Check if token exists
const token = localStorage.getItem('token');
if (token) {
    console.log('✅ Token found in localStorage');
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    
    // Decode JWT to check expiration (without verification)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
            console.log('❌ Token is EXPIRED');
        } else {
            console.log('✅ Token is still valid');
        }
    } catch (e) {
        console.log('⚠️ Could not decode token:', e.message);
    }
} else {
    console.log('❌ No token found in localStorage');
}

// Check current user
const userData = localStorage.getItem('user');
if (userData) {
    try {
        const user = JSON.parse(userData);
        console.log('✅ User data found:', user);
    } catch (e) {
        console.log('⚠️ Invalid user data in localStorage');
    }
} else {
    console.log('❌ No user data found in localStorage');
}

// Test API call
async function testAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authentication test successful:', data);
        } else {
            console.log('❌ Authentication test failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Authentication test error:', error);
    }
}

if (token) {
    testAuth();
}
