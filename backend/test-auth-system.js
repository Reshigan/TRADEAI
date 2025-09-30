const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

// Test users from Modelex setup
const testUsers = [
  { email: 'thabo.mthembu@modelex.co.za', password: 'Modelex2024!', role: 'admin' },
  { email: 'sarah.vandermerwe@modelex.co.za', password: 'Modelex2024!', role: 'manager' },
  { email: 'johan.pretorius@modelex.co.za', password: 'Modelex2024!', role: 'kam' },
  { email: 'david.chen@modelex.co.za', password: 'Modelex2024!', role: 'analyst' },
  { email: 'zanele.ndaba@modelex.co.za', password: 'Modelex2024!', role: 'user' }
];

async function testAuthentication() {
  console.log('🔐 Testing Authentication System\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const user of testUsers) {
    console.log(`Testing user: ${user.email} (${user.role})`);
    
    try {
      // Test 1: Login
      totalTests++;
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (loginResponse.data.success && loginResponse.data.token) {
        console.log('  ✅ Login successful');
        passedTests++;
        
        const token = loginResponse.data.token;
        const userData = loginResponse.data.user;
        
        // Verify user data
        if (userData.role === user.role) {
          console.log('  ✅ Role verification passed');
        } else {
          console.log('  ❌ Role verification failed');
        }
        
        // Test 2: Token validation
        totalTests++;
        try {
          const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (profileResponse.data) {
            console.log('  ✅ Token validation successful');
            passedTests++;
          } else {
            console.log('  ❌ Token validation failed');
          }
        } catch (error) {
          console.log('  ❌ Token validation error:', error.response?.data?.message || error.message);
        }
        
        // Test 3: Protected route access
        totalTests++;
        try {
          const customersResponse = await axios.get(`${BASE_URL}/customers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (customersResponse.data && customersResponse.data.success) {
            console.log('  ✅ Protected route access successful');
            passedTests++;
          } else {
            console.log('  ❌ Protected route access failed');
          }
        } catch (error) {
          console.log('  ❌ Protected route access error:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('  ❌ Login failed');
      }
    } catch (error) {
      console.log('  ❌ Login error:', error.response?.data?.message || error.message);
    }
    
    console.log('');
  }
  
  // Test 4: Invalid credentials
  totalTests++;
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ Invalid credentials test failed - should have been rejected');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid credentials properly rejected');
      passedTests++;
    } else {
      console.log('❌ Invalid credentials test error:', error.message);
    }
  }
  
  // Test 5: Missing token access
  totalTests++;
  try {
    await axios.get(`${BASE_URL}/auth/me`);
    console.log('❌ Missing token test failed - should have been rejected');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Missing token properly rejected');
      passedTests++;
    } else {
      console.log('❌ Missing token test error:', error.message);
    }
  }
  
  console.log(`\n📊 Authentication Test Results: ${passedTests}/${totalTests} tests passed`);
  return { passed: passedTests, total: totalTests };
}

testAuthentication().catch(console.error);
