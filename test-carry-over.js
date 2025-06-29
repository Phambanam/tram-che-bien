// Test script for Carry Over feature in Military Logistics System
// Run this script to create test data for carry over functionality

const { format, subDays } = require('date-fns');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NWY5OGQyZDljMTdhOTRkYzZjYjliNCIsImlhdCI6MTc1MTExMTUwNSwiZXhwIjoxNzUxMTk3OTA1fQ.ilSCsFIYY-Wje_Tk-Xf5vL7wBLCOt4USKDDrkYLkUf0'; // Replace with actual token

// Test data for yesterday (creates surplus to carry over)
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const today = format(new Date(), 'yyyy-MM-dd');

const testData = {
  // Salt Processing (Muối nén)
  salt: {
    date: yesterday,
    cabbageInput: 100,    // Rau cải chi: 100kg
    saltInput: 60,        // Dưa muối thu: 60kg  
    saltOutput: 40,       // Dưa muối xuất: 40kg
    // THỪA: 20kg dưa muối → chuyển sang hôm nay
    cabbagePrice: 8000,
    saltPrice: 12000,
    note: "Test data for carry over - ngày hôm qua có thừa 20kg dưa muối"
  },
  
  // Tofu Processing (Đậu phụ) 
  tofu: {
    date: yesterday,
    soybeanInput: 80,     // Đậu nành chi: 80kg
    tofuInput: 150,       // Đậu phụ thu: 150kg
    tofuOutput: 120,      // Đậu phụ xuất: 120kg
    // THỪA: 30kg đậu phụ → chuyển sang hôm nay
    soybeanPrice: 12000,
    tofuPrice: 15000,
    note: "Test data for carry over - ngày hôm qua có thừa 30kg đậu phụ"
  },
  
  // Bean Sprouts (Giá đỗ)
  beanSprouts: {
    date: yesterday,
    soybeansInput: 50,         // Đậu tương chi: 50kg
    beanSproutsInput: 200,     // Giá đỗ thu: 200kg
    beanSproutsOutput: 170,    // Giá đỗ xuất: 170kg
    // THỪA: 30kg giá đỗ → chuyển sang hôm nay
    soybeansPrice: 10000,
    beanSproutsPrice: 8000,
    note: "Test data for carry over - ngày hôm qua có thừa 30kg giá đỗ"
  },
  
  // Sausage Processing (Giò chả)
  sausage: {
    date: yesterday,
    leanMeatInput: 40,    // Thịt nạc chi: 40kg
    fatMeatInput: 20,     // Thịt mỡ chi: 20kg
    sausageInput: 45,     // Giò chả thu: 45kg
    sausageOutput: 35,    // Giò chả xuất: 35kg
    // THỪA: 10kg giò chả → chuyển sang hôm nay
    leanMeatPrice: 180000,
    fatMeatPrice: 120000,
    sausagePrice: 200000,
    note: "Test data for carry over - ngày hôm qua có thừa 10kg giò chả"
  },
  
  // Livestock Processing (Giết mổ)
  livestock: {
    date: yesterday,
    liveAnimalsInput: 3,      // Lợn sống chi: 3 con
    meatOutput: 180,          // Thịt thu: 180kg
    actualMeatOutput: 150,    // Thịt xuất: 150kg
    // THỪA: 30kg thịt lợn → chuyển sang hôm nay
    liveAnimalPrice: 4000000, // 4M VND/con
    meatPrice: 150000,        // 150k VND/kg
    note: "Test data for carry over - ngày hôm qua có thừa 30kg thịt lợn"
  }
};

async function createTestData() {
  console.log('🚀 Creating test data for carry over feature...');
  console.log(`📅 Yesterday: ${yesterday}`);
  console.log(`📅 Today: ${today}`);
  console.log('');
  
  try {
    // Create test data for each processing station
    for (const [type, data] of Object.entries(testData)) {
      console.log(`📦 Creating ${type} test data...`);
      
      const endpoint = type === 'sausage' ? 
        `${BASE_URL}/processing-station/sausage/${yesterday}` :
        `${BASE_URL}/processing-station/daily/${yesterday}`;
      
      try {
        const response = await axios.patch(endpoint, data, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${type}: Created with surplus for carry over`);
      } catch (error) {
        console.log(`❌ ${type}: Error - ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n🎉 Test data creation completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to front-end processing station tabs');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Check Console for carry over logs');
    console.log('4. Look for blue banner: "🔄 Chuyển kho từ ngày trước"');
    console.log('5. Check notes for carry over information');
    console.log('\n💡 Expected carry over amounts:');
    console.log('- Salt: +20kg dưa muối');
    console.log('- Tofu: +30kg đậu phụ');
    console.log('- Bean Sprouts: +30kg giá đỗ');
    console.log('- Sausage: +10kg giò chả');
    console.log('- Livestock: +30kg thịt lợn');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  }
}

// Run the test
createTestData();

// Export for manual testing
module.exports = {
  testData,
  createTestData,
  yesterday,
  today
}; 