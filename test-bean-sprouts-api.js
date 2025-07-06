// Using Node.js built-in fetch (Node 18+)

async function testBeanSproutsAPI() {
  const baseURL = 'http://localhost:5001/api';
  const headers = {
    'Content-Type': 'application/json',
  };

  console.log('🚀 Testing Bean Sprouts API endpoints...\n');

  try {
    // Test 1: Create some sample daily data
    console.log('📝 Test 1: Creating sample daily bean sprouts processing data...');
    const testDate = '2025-01-15';
    const dailyData = {
      date: testDate,
      soybeansInput: 100,
      beanSproutsInput: 280,
      beanSproutsOutput: 250,
      soybeansPrice: 15000,
      beanSproutsPrice: 8000,
      byProductQuantity: 10,
      byProductPrice: 3000,
      otherCosts: 50000,
      note: 'Test data for bean sprouts processing'
    };

    const createResponse = await fetch(`${baseURL}/bean-sprouts-calculation/daily-processing`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dailyData)
    });

    const createResult = await createResponse.json();
    console.log('✅ Create daily data result:', createResult.success ? 'SUCCESS' : 'FAILED');
    if (!createResult.success) {
      console.log('❌ Error:', createResult.message);
    }

    // Test 2: Get daily data
    console.log('\n📖 Test 2: Getting daily bean sprouts processing data...');
    const getDailyResponse = await fetch(`${baseURL}/bean-sprouts-calculation/daily-processing?date=${testDate}`, {
      headers
    });

    const getDailyResult = await getDailyResponse.json();
    console.log('✅ Get daily data result:', getDailyResult.success ? 'SUCCESS' : 'FAILED');
    if (getDailyResult.success) {
      console.log('📊 Daily data:', getDailyResult.data);
    }

    // Test 3: Get weekly tracking data
    console.log('\n📅 Test 3: Getting weekly bean sprouts tracking data...');
    const currentWeek = 3; // Week 3 of 2025
    const currentYear = 2025;
    
    const getWeeklyResponse = await fetch(`${baseURL}/bean-sprouts-calculation/weekly-tracking?week=${currentWeek}&year=${currentYear}`, {
      headers
    });

    const getWeeklyResult = await getWeeklyResponse.json();
    console.log('✅ Get weekly data result:', getWeeklyResult.success ? 'SUCCESS' : 'FAILED');
    if (getWeeklyResult.success) {
      console.log('📊 Weekly data summary:');
      console.log('  - Days in week:', getWeeklyResult.data.dailyData.length);
      console.log('  - Total soybeans input:', getWeeklyResult.data.totals.totalSoybeansInput);
      console.log('  - Total bean sprouts collected:', getWeeklyResult.data.totals.totalBeanSproutsCollected);
    }

    // Test 4: Get monthly summary data
    console.log('\n📈 Test 4: Getting monthly bean sprouts summary data...');
    const currentMonth = 1; // January 2025
    const currentMonthYear = 2025;
    
    const getMonthlyResponse = await fetch(`${baseURL}/bean-sprouts-calculation/monthly-summary?month=${currentMonth}&year=${currentMonthYear}&monthCount=3`, {
      headers
    });

    const getMonthlyResult = await getMonthlyResponse.json();
    console.log('✅ Get monthly data result:', getMonthlyResult.success ? 'SUCCESS' : 'FAILED');
    if (getMonthlyResult.success) {
      console.log('📊 Monthly summary:');
      console.log('  - Months returned:', getMonthlyResult.data.monthlySummaries.length);
      getMonthlyResult.data.monthlySummaries.forEach(month => {
        console.log(`  - ${month.month}: ${month.totalBeanSproutsCollected}kg collected, ${month.netProfit ? month.netProfit + 'k VND profit' : 'no financial data'}`);
      });
    }

    // Test 5: Create more sample data for different dates
    console.log('\n📝 Test 5: Creating more sample data for week/month testing...');
    const dates = ['2025-01-13', '2025-01-14', '2025-01-16', '2025-01-17'];
    
    for (const date of dates) {
      const sampleData = {
        date,
        soybeansInput: 80 + Math.floor(Math.random() * 40),
        beanSproutsInput: 220 + Math.floor(Math.random() * 120),
        beanSproutsOutput: 200 + Math.floor(Math.random() * 50),
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 8 + Math.floor(Math.random() * 4),
        byProductPrice: 3000,
        otherCosts: 40000 + Math.floor(Math.random() * 20000),
        note: `Sample data for ${date}`
      };

      const response = await fetch(`${baseURL}/bean-sprouts-calculation/daily-processing`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sampleData)
      });

      const result = await response.json();
      console.log(`  ✅ ${date}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    }

    console.log('\n🎉 Bean Sprouts API testing completed!');

  } catch (error) {
    console.error('❌ Error testing Bean Sprouts API:', error.message);
  }
}

// Run the test
testBeanSproutsAPI(); 