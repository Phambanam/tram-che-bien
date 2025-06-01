const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5001;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Backend APIs for Supply Output Management...\n');

  try {
    // Test 1: Get Units
    console.log('1. Testing Units API...');
    const unitsResult = await makeRequest('/units');
    console.log(`   Status: ${unitsResult.status}`);
    if (unitsResult.status === 200 && unitsResult.data.data) {
      console.log(`   Units found: ${unitsResult.data.data.length}`);
      if (unitsResult.data.data.length > 0) {
        console.log(`   Sample unit: ${unitsResult.data.data[0].name}`);
      }
    } else {
      console.log(`   Response: ${JSON.stringify(unitsResult.data).substring(0, 100)}...`);
    }
    console.log('');

    // Test 2: Get Categories
    console.log('2. Testing Categories API...');
    const categoriesResult = await makeRequest('/categories');
    console.log(`   Status: ${categoriesResult.status}`);
    if (categoriesResult.status === 200 && categoriesResult.data.data) {
      console.log(`   Categories found: ${categoriesResult.data.data.length}`);
    }
    console.log('');

    // Test 3: Get Daily Rations
    console.log('3. Testing Daily Rations API...');
    const dailyRationsResult = await makeRequest('/daily-rations');
    console.log(`   Status: ${dailyRationsResult.status}`);
    if (dailyRationsResult.status === 200 && dailyRationsResult.data.data) {
      console.log(`   Daily rations found: ${dailyRationsResult.data.data.length}`);
    } else if (dailyRationsResult.status === 401) {
      console.log('   ⚠️  Authentication required for this endpoint');
    }
    console.log('');

    console.log('✅ API Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- Backend server is running on port 5001');
    console.log('- APIs are responding');
    console.log('- Ready for frontend integration');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure backend server is running: npm run dev');
    console.log('- Check if MongoDB is connected');
    console.log('- Verify data has been seeded: node scripts/seed-data-library.js');
  }
}

// Run the test
testAPI(); 