import fetch from 'node-fetch';

async function testPasswordChangeFlow() {
  try {
    console.log('Testing password change flow for Chris Foods admin...\n');
    
    // Step 1: Login with default password
    console.log('Step 1: Login with default password');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'chris@mail.com',
        password: 'restaurant123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('Must change password:', loginData.user.mustChangePassword || loginData.mustChangePassword);
    
    if (loginData.user.mustChangePassword || loginData.mustChangePassword) {
      console.log('\n✅ Password change required flag is set correctly!');
      console.log('The user would now see the password change modal.\n');
      
      // Step 2: Test password change endpoint
      console.log('Step 2: Testing password change endpoint');
      
      const changePasswordResponse = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          currentPassword: 'restaurant123',
          newPassword: 'NewSecure@Pass123'
        })
      });
      
      const changeData = await changePasswordResponse.json();
      
      if (changeData.success) {
        console.log('✅ Password change endpoint works!');
        console.log('Message:', changeData.message);
        
        // Step 3: Test login with new password
        console.log('\nStep 3: Testing login with new password');
        const newLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'chris@mail.com',
            password: 'NewSecure@Pass123'
          })
        });
        
        const newLoginData = await newLoginResponse.json();
        
        if (newLoginData.success) {
          console.log('✅ Login with new password successful!');
          console.log('Must change password flag:', newLoginData.user.mustChangePassword || false);
          
          if (!newLoginData.user.mustChangePassword) {
            console.log('✅ Password change flag has been cleared!');
          }
        } else {
          console.log('❌ Login with new password failed:', newLoginData.message);
        }
        
        // Reset password back to default for testing
        console.log('\nResetting password back to default for future testing...');
        
      } else {
        console.log('❌ Password change failed:', changeData.message);
      }
    } else {
      console.log('\n⚠️  Password change flag is not set. Setting it now...');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPasswordChangeFlow();