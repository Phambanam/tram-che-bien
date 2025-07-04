const fetch = require('node-fetch');

// Test LTTP API endpoint without authentication
async function testLttpApi() {
  const testDate = '2025-01-07';
  const apiUrl = `http://localhost:5001/api/processing-station/lttp/${testDate}`;
  
  console.log('🚀 Testing LTTP API...');
  console.log('URL:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ API working correctly');
      console.log('📊 Data items found:', data.data ? data.data.length : 0);
      
      if (data.data && data.data.length > 0) {
        console.log('📋 Sample items:');
        data.data.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name} (${item.category}) - Source: ${item.source || 'manual'}`);
        });
      }
    } else {
      console.log('❌ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test with different dates
async function testMultipleDates() {
  const dates = ['2025-01-07', '2025-01-08', '2025-01-09'];
  
  for (const date of dates) {
    console.log(`\n📅 Testing date: ${date}`);
    const apiUrl = `http://localhost:5001/api/processing-station/lttp/${date}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.status === 200) {
        console.log(`✅ Found ${data.data ? data.data.length : 0} items`);
        
        if (data.data && data.data.length > 0) {
          const processingItems = data.data.filter(item => item.source && item.source.includes('processing'));
          const manualItems = data.data.filter(item => !item.source || !item.source.includes('processing'));
          
          console.log(`  📊 Processing items: ${processingItems.length}`);
          console.log(`  📝 Manual items: ${manualItems.length}`);
        }
      } else {
        console.log(`❌ Error: ${data.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting LTTP API tests...\n');
  
  await testLttpApi();
  await testMultipleDates();
  
  console.log('\n🎉 LTTP API testing completed!');
}

runTests().catch(console.error); 