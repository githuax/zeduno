// Simple script to generate a mock JWT token for testing
// This creates a token that the backend auth middleware will recognize

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
              Buffer.from(JSON.stringify({
                id: 'joe-pizza-admin-id',
                email: 'admin@joespizzapalace.com',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
              })).toString('base64') + 
              '.mock_signature_for_development';

console.log('Mock token generated:');
console.log(token);
console.log('\nTo use this token:');
console.log('1. Open browser DevTools');
console.log('2. Go to Application/Storage > Local Storage');
console.log('3. Set key "token" with the above value');
console.log('4. Refresh the page');

// Also set it for immediate use
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('token', token);
  console.log('\nToken set in localStorage!');
}
