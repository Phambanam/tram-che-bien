const fetch = require('node-fetch');

async function testSupplyOutputsAPI() {
  try {
    // Test without auth first (should return 401)
    console.log('🔍 Testing supply outputs API...\n');
    
    const testDates = ['2025-06-30', '2025-07-01', '2025-07-02'];
    
    for (const date of testDates) {
      console.log(`📅 Testing ${date}:`);
      
      const url = `http://localhost:5001/api/supply-outputs?startDate=${date}&endDate=${date}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      const data = await response.text();
      console.log(`Response: ${data.substring(0, 200)}...`);
      console.log('---\n');
    }
    
    // Test a non-auth endpoint to check if server is responding correctly
    console.log('🔍 Testing non-auth endpoint (if any)...');
    const healthResponse = await fetch('http://localhost:5001/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Health check status: ${healthResponse.status}`);
    const healthData = await healthResponse.text();
    console.log(`Health response: ${healthData}`);
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testSupplyOutputsAPI().catch(console.error);
