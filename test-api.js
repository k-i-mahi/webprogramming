const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Civit API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}`);
    console.log('✅ Server is running:', healthResponse.data.message);

    // Test 2: Test authentication endpoint
    console.log('\n2. Testing authentication endpoint...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.log('✅ Auth endpoint is working (expected error for invalid credentials)');
      } else {
        console.log('❌ Auth endpoint error:', error.message);
      }
    }

    // Test 3: Test issues endpoint (should require auth)
    console.log('\n3. Testing issues endpoint...');
    try {
      await axios.get(`${API_URL}/issues`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Issues endpoint is protected (requires authentication)');
      } else {
        console.log('❌ Issues endpoint error:', error.message);
      }
    }

    // Test 4: Test categories endpoint (should require auth)
    console.log('\n4. Testing categories endpoint...');
    try {
      await axios.get(`${API_URL}/categories`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Categories endpoint is protected (requires authentication)');
      } else {
        console.log('❌ Categories endpoint error:', error.message);
      }
    }

    console.log('\n🎉 API tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Register a user account through the frontend');
    console.log('3. Login and test the issue creation functionality');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend server is running on port 5000');
    console.log('2. Check if MongoDB is running');
    console.log('3. Verify the .env file has correct configuration');
  }
}

// Run the test
testAPI();
