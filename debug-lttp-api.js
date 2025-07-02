const fetch = require('node-fetch');

// Test LTTP API endpoint
async function testLttpApi() {
  const testDate = '2025-01-07';
  const apiUrl = `http://localhost:5001/api/processing-station/lttp/${testDate}`;
  
  console.log('🚀 Testing LTTP API...');
  console.log('URL:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed - you may need to get a real token
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with real token
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ API working correctly');
    } else {
      console.log('❌ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testLttpApi(); 