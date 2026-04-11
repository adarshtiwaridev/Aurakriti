import axios from 'axios';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  let attempts = 0;
  const maxAttempts = 5;
  const port = 3000;

  while (attempts < maxAttempts) {
    try {
      console.log(`\nAttempt ${attempts + 1}/${maxAttempts}...`);
      const response = await axios.get(`http://localhost:${port}/`, { timeout: 5000 });
      console.log('✓ Server is responding on port', port);
      break;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('✗ Server not responding after', maxAttempts, 'attempts');
        process.exit(1);
      }
      console.log('Waiting for server...', error.code || error.message);
      await wait(2000);
    }
  }

  // Now test signup
  try {
    const testEmail = `testuser-${Date.now()}@example.com`;
    
    console.log('\n=== TESTING SIGNUP ===');
    console.log('Email:', testEmail);

    const response = await axios.post(`http://localhost:${port}/api/auth/signup`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      role: 'user',
    });

    console.log('\n✓ Signup successful');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('Data:', JSON.stringify(response.data.data, null, 2));

  } catch (error) {
    console.error('\n✗ Signup failed');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data);
  }
}

testAPI();
