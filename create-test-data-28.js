// Create test data for Day 28 with surplus for carry over testing
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NWY5OGQyZDljMTdhOTRkYzZjYjliNCIsImlhdCI6MTc1MTExMTUwNSwiZXhwIjoxNzUxMTk3OTA1fQ.ilSCsFIYY-Wje_Tk-Xf5vL7wBLCOt4USKDDrkYLkUf0';

// Test data for Day 28 with deliberate surplus
const DAY_28 = '2025-06-28';
const testData = {
  date: DAY_28,
  soybeanInput: 50,     // Đậu nành chi: 50kg
  tofuInput: 120,       // Đậu phụ thu: 120kg  
  // tofuOutput will be calculated from planned outputs (should be around 42kg based on your 78kg surplus)
  // Expected surplus: 120 - 42 = 78kg
  soybeanPrice: 12000,
  tofuPrice: 15000,
  note: "Test data for carry over - Day 28 should have 78kg surplus"
};

async function createTestData() {
  console.log('🚀 Creating test data for Day 28 carry over...');
  console.log('===========================================');
  console.log(`📅 Date: ${DAY_28}`);
  console.log(`📦 Test Data:`, testData);
  console.log('');

  try {
    // Create test data for Day 28
    console.log('📦 Creating Day 28 test data...');
    
    const response = await axios.patch(`${BASE_URL}/processing-station/daily/${DAY_28}`, testData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Day 28 data created successfully');
    console.log('Response:', response.data);
    
    // Verify the data was created
    console.log('\n🔍 Verifying created data...');
    const verifyResponse = await axios.get(`${BASE_URL}/processing-station/daily/${DAY_28}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    console.log('Verification Response:', verifyResponse.data);
    
    // Extract the actual data (handling nested structure)
    const actualData = verifyResponse.data?.data || verifyResponse.data;
    console.log('Actual Data Stored:', actualData);
    
    if (actualData) {
      console.log('\n📊 Expected Carry Over Calculation:');
      console.log(`- Tofu Input: ${actualData.tofuInput}kg`);
      console.log(`- Tofu Output: ${actualData.tofuOutput || 0}kg (will be calculated from planned outputs)`);
      console.log(`- Expected Surplus: ${actualData.tofuInput - (actualData.tofuOutput || 0)}kg`);
      console.log(`- Should carry over to Day 29: ${Math.max(0, actualData.tofuInput - (actualData.tofuOutput || 0))}kg`);
    }
    
    console.log('\n🎯 SUCCESS! Test data created for Day 28');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to front-end tofu processing tab');
    console.log('2. Open F12 → Console');
    console.log('3. Refresh the page');
    console.log('4. Look for carry over logs:');
    console.log('   🔄 Checking tofu carry over from 2025-06-28 to 2025-06-29');
    console.log('   🔍 Previous API Response: ...');
    console.log('   🔍 Previous Data Extracted: ...');
    console.log('   🔍 Carry over calculation: 120 - X = Ykg');
    console.log('   ✅ Tofu carry over found: Ykg from 2025-06-28');
    console.log('5. Check if blue banner appears: "🔄 Chuyển kho từ ngày trước"');
    console.log('6. Check if tofu input shows the carry over amount');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Token might be expired. Please:');
      console.log('1. Go to browser → F12 → Application → Cookies');
      console.log('2. Copy the latest auth token');
      console.log('3. Update AUTH_TOKEN in this script');
    }
  }
}

// Run the test
createTestData();

module.exports = { createTestData }; 