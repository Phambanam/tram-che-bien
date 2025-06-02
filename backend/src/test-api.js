// Simple test script to check API response for supplies
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSuppliesAPI() {
  try {
    console.log('Testing GET /api/supplies without authentication...');
    const response = await fetch('http://localhost:5001/api/supplies');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    if (response.status === 401) {
      console.log('Authentication required, attempting to login...');
      
      // First test with admin credentials
      const credentials = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'ludoan', password: 'password123', role: 'brigadeAssistant' },
        { username: 'tieudoan1', password: 'password123', role: 'unitAssistant' }
      ];
      
      for (const cred of credentials) {
        console.log(`\nTesting with ${cred.role} credentials (${cred.username})...`);
        
        // Login to get token
        const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: cred.username,
            password: cred.password
          })
        });
        
        if (!loginResponse.ok) {
          console.log(`Login failed for ${cred.username}: ${loginResponse.status} ${loginResponse.statusText}`);
          continue;
        }
        
        const loginData = await loginResponse.json();
        console.log(`Login successful for ${cred.username}, token received`);
        
        // Try again with authentication
        console.log(`Testing GET /api/supplies with ${cred.role} authentication...`);
        const authResponse = await fetch('http://localhost:5001/api/supplies', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        console.log('Status:', authResponse.status);
        console.log('Status Text:', authResponse.statusText);
        
        if (authResponse.ok) {
          const data = await authResponse.json();
          console.log('Response Data Length:', Array.isArray(data) ? data.length : 'Not an array');
          console.log('Response Data Type:', typeof data);
          if (Array.isArray(data) && data.length > 0) {
            console.log('Response Sample:', JSON.stringify(data[0], null, 2));
          } else {
            console.log('Response is empty array or not an array');
          }
        } else {
          console.log(`Failed to get supplies with ${cred.role} authentication`);
        }
      }
    } else if (response.ok) {
      const data = await response.json();
      console.log('Response Data Length:', Array.isArray(data) ? data.length : 'Not an array');
      console.log('Response Data Type:', typeof data);
      console.log('Response Sample:', JSON.stringify(data.slice(0, 1), null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSuppliesAPI(); 