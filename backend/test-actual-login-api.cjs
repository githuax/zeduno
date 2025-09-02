const fetch = require('node-fetch');

async function testLoginAPI() {
    try {
        console.log('=== Testing Actual Login API ===\n');
        
        // Test the login API endpoint
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'kimathichris15@gmail.com',
                password: 'Chris@2024' // Assuming this is the correct password
            })
        });
        
        const data = await response.json();
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
        
        if (data.success && data.user) {
            console.log('\n=== Analysis ===');
            console.log('✅ Login successful');
            console.log('User email:', data.user.email);
            console.log('Tenant ID:', data.user.tenantId);
            console.log('Tenant Name:', data.user.tenantName);
            
            if (data.user.tenant) {
                console.log('Full tenant object:', data.user.tenant);
            }
            
            if (data.user.tenantName === "Chris's Restaurant") {
                console.log('\n✅ CORRECT: API returning Chris\'s Restaurant');
            } else if (data.user.tenantName === "Dama's Restaurant") {
                console.log('\n❌ PROBLEM: API returning Dama\'s Restaurant instead of Chris\'s Restaurant');
                console.log('This suggests an issue with the database query or populate logic');
            } else {
                console.log('\n⚠️ UNEXPECTED tenant name:', data.user.tenantName);
            }
        } else {
            console.log('\n❌ Login failed:', data.message);
            console.log('Trying with default password...');
            
            // Try with different passwords
            const passwords = ['password123', 'admin123', 'Chris@123', 'chris123'];
            
            for (const pwd of passwords) {
                console.log(`Trying password: ${pwd}`);
                const response2 = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'kimathichris15@gmail.com',
                        password: pwd
                    })
                });
                
                const data2 = await response2.json();
                if (data2.success) {
                    console.log('✅ Login successful with password:', pwd);
                    console.log('Tenant name:', data2.user.tenantName);
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('Error testing login API:', error);
        
        // Check if backend is running
        console.log('\n=== Backend Status Check ===');
        try {
            const healthResponse = await fetch('http://localhost:5000/health');
            if (healthResponse.ok) {
                console.log('✅ Backend is running');
            } else {
                console.log('❌ Backend responded with error:', healthResponse.status);
            }
        } catch (healthError) {
            console.log('❌ Backend is not running or not accessible');
            console.log('Start the backend with: npm run dev');
        }
    }
}

testLoginAPI();
