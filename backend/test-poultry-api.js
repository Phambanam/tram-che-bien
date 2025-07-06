const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const MONGO_URI = 'mongodb://localhost:27017/military-logistics';

// Mock authentication token for testing
const TEST_TOKEN = 'test-admin-token';

// Helper function to make API requests
async function makeApiRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error making API request to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to seed test data
async function seedTestData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('military-logistics');
    
    // Clear existing data
    await db.collection('dailyPoultryProcessing').deleteMany({});
    console.log('Cleared existing poultry data');
    
    // Create test data for the current week
    const testData = [];
    const today = new Date();
    
    // Generate data for the last 14 days to ensure we have weekly data
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyData = {
        date: dateStr,
        livePoultryInput: 100 + Math.floor(Math.random() * 50), // 100-150 kg
        poultryMeatOutput: 80 + Math.floor(Math.random() * 40), // 80-120 kg
        poultryMeatActualOutput: 70 + Math.floor(Math.random() * 30), // 70-100 kg
        poultryMeatRemaining: 0, // Will be calculated
        note: `Test data for ${dateStr}`,
        livePoultryPrice: 60000 + Math.floor(Math.random() * 10000), // 60-70k VND/kg
        poultryMeatPrice: 150000 + Math.floor(Math.random() * 20000), // 150-170k VND/kg
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Calculate remaining
      dailyData.poultryMeatRemaining = Math.max(0, dailyData.poultryMeatOutput - dailyData.poultryMeatActualOutput);
      
      testData.push(dailyData);
    }
    
    // Insert test data
    await db.collection('dailyPoultryProcessing').insertMany(testData);
    console.log(`Inserted ${testData.length} test records`);
    
    // Print sample data
    console.log('\nSample test data:');
    testData.slice(0, 3).forEach(data => {
      console.log(`${data.date}: Input=${data.livePoultryInput}kg, Output=${data.poultryMeatOutput}kg, Actual=${data.poultryMeatActualOutput}kg`);
    });
    
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await client.close();
  }
}

// Test daily poultry data endpoint
async function testDailyPoultryData() {
  console.log('\n=== Testing Daily Poultry Data ===');
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await makeApiRequest(`/processing-station/poultry/${today}`);
    console.log('Daily poultry data response:', JSON.stringify(response, null, 2));
    
    if (response.success && response.data) {
      console.log('✅ Daily poultry data retrieved successfully');
      console.log(`   Input: ${response.data.livePoultryInput}kg`);
      console.log(`   Output: ${response.data.poultryMeatOutput}kg`);
      console.log(`   Actual: ${response.data.poultryMeatActualOutput}kg`);
    } else {
      console.log('❌ Failed to retrieve daily poultry data');
    }
  } catch (error) {
    console.log('❌ Error testing daily poultry data:', error.message);
  }
}

// Test weekly poultry tracking endpoint
async function testWeeklyPoultryTracking() {
  console.log('\n=== Testing Weekly Poultry Tracking ===');
  
  // Get current week and year
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();
  
  console.log(`Testing week ${currentWeek} of year ${currentYear}`);
  
  try {
    const response = await makeApiRequest(`/processing-station/poultry/weekly-tracking?week=${currentWeek}&year=${currentYear}`);
    console.log('Weekly poultry tracking response:', JSON.stringify(response, null, 2));
    
    if (response.success && response.data) {
      console.log('✅ Weekly poultry tracking retrieved successfully');
      console.log(`   Week: ${response.data.week}`);
      console.log(`   Year: ${response.data.year}`);
      console.log(`   Daily data count: ${response.data.dailyData?.length || 0}`);
      
      if (response.data.dailyData && response.data.dailyData.length > 0) {
        console.log('   Sample daily data:');
        response.data.dailyData.slice(0, 3).forEach(day => {
          console.log(`     ${day.date}: Input=${day.livePoultryInput}kg, Output=${day.poultryMeatOutput}kg`);
        });
      }
      
      if (response.data.totals) {
        console.log('   Weekly totals:');
        console.log(`     Total Input: ${response.data.totals.totalLivePoultryInput}kg`);
        console.log(`     Total Output: ${response.data.totals.totalPoultryMeatOutput}kg`);
      }
    } else {
      console.log('❌ Failed to retrieve weekly poultry tracking');
    }
  } catch (error) {
    console.log('❌ Error testing weekly poultry tracking:', error.message);
  }
}

// Test monthly poultry summary endpoint
async function testMonthlyPoultrySummary() {
  console.log('\n=== Testing Monthly Poultry Summary ===');
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  console.log(`Testing month ${currentMonth} of year ${currentYear}`);
  
  try {
    const response = await makeApiRequest(`/processing-station/poultry/monthly-summary?month=${currentMonth}&year=${currentYear}&monthCount=3`);
    console.log('Monthly poultry summary response:', JSON.stringify(response, null, 2));
    
    if (response.success && response.data) {
      console.log('✅ Monthly poultry summary retrieved successfully');
      console.log(`   Target month: ${response.data.targetMonth}`);
      console.log(`   Target year: ${response.data.targetYear}`);
      console.log(`   Monthly summaries count: ${response.data.monthlySummaries?.length || 0}`);
      
      if (response.data.monthlySummaries && response.data.monthlySummaries.length > 0) {
        console.log('   Sample monthly data:');
        response.data.monthlySummaries.slice(0, 2).forEach(month => {
          console.log(`     ${month.month}: Input=${month.totalLivePoultryInput}kg, Output=${month.totalPoultryMeatOutput}kg, Profit=${month.netProfit}k VND`);
        });
      }
    } else {
      console.log('❌ Failed to retrieve monthly poultry summary');
    }
  } catch (error) {
    console.log('❌ Error testing monthly poultry summary:', error.message);
  }
}

// Test updating daily poultry data
async function testUpdateDailyPoultryData() {
  console.log('\n=== Testing Update Daily Poultry Data ===');
  
  const today = new Date().toISOString().split('T')[0];
  
  const updateData = {
    livePoultryInput: 120,
    poultryMeatOutput: 95,
    poultryMeatActualOutput: 85,
    poultryMeatRemaining: 10,
    note: 'Updated test data',
    livePoultryPrice: 65000,
    poultryMeatPrice: 160000
  };
  
  try {
    const response = await makeApiRequest(`/processing-station/poultry/${today}`, 'PATCH', updateData);
    console.log('Update daily poultry data response:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('✅ Daily poultry data updated successfully');
      
      // Verify the update by getting the data again
      const verifyResponse = await makeApiRequest(`/processing-station/poultry/${today}`);
      if (verifyResponse.success && verifyResponse.data) {
        console.log('✅ Update verified - new data:');
        console.log(`   Input: ${verifyResponse.data.livePoultryInput}kg`);
        console.log(`   Output: ${verifyResponse.data.poultryMeatOutput}kg`);
        console.log(`   Price: ${verifyResponse.data.livePoultryPrice} VND/kg`);
      }
    } else {
      console.log('❌ Failed to update daily poultry data');
    }
  } catch (error) {
    console.log('❌ Error testing update daily poultry data:', error.message);
  }
}

// Helper function to get week number
function getWeekNumber(date) {
  const firstJanuary = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstJanuary) / 86400000;
  return Math.ceil((pastDaysOfYear + firstJanuary.getDay() + 1) / 7);
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Poultry API Tests...\n');
  
  try {
    // Step 1: Seed test data
    console.log('Step 1: Seeding test data...');
    await seedTestData();
    
    // Step 2: Test daily endpoint
    await testDailyPoultryData();
    
    // Step 3: Test weekly endpoint
    await testWeeklyPoultryTracking();
    
    // Step 4: Test monthly endpoint
    await testMonthlyPoultrySummary();
    
    // Step 5: Test update endpoint
    await testUpdateDailyPoultryData();
    
    // Step 6: Test weekly again after update
    console.log('\n=== Re-testing Weekly After Update ===');
    await testWeeklyPoultryTracking();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
} 