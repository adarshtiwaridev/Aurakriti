import axios from 'axios';

const API_BASE = 'http://localhost:3001';

async function testSignup() {
  try {
    const testEmail = `testuser-${Date.now()}@example.com`;
    
    console.log('Testing signup at:', `${API_BASE}/api/auth/signup`);
    console.log('Payload:', {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      role: 'user',
    });

    const response = await axios.post(`${API_BASE}/api/auth/signup`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      role: 'user',
    });

    console.log('\n✓ Signup response:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n✗ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testSignup();
