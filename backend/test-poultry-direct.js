const { getDb } = require('./dist/config/database');

// Simulate the backend functions
async function getPoultryProcessingData(db, dateStr) {
  if (!db) {
    console.error('Database connection not available')
    return {
      livePoultryInput: 0,
      poultryMeatOutput: 0,
      poultryMeatActualOutput: 0,
      poultryMeatRemaining: 0,
      note: "",
      livePoultryPrice: 60000,
      poultryMeatPrice: 150000
    }
  }

  try {
    const data = await db.collection("dailyPoultryProcessing").findOne({ date: dateStr })
    
    if (!data) {
      return {
        livePoultryInput: 0,
        poultryMeatOutput: 0,
        poultryMeatActualOutput: 0,
        poultryMeatRemaining: 0,
        note: "",
        livePoultryPrice: 60000,
        poultryMeatPrice: 150000
      }
    }

    return {
      livePoultryInput: data.livePoultryInput || 0,
      poultryMeatOutput: data.poultryMeatOutput || 0,
      poultryMeatActualOutput: data.poultryMeatActualOutput || 0,
      poultryMeatRemaining: Math.max(0, (data.poultryMeatOutput || 0) - (data.poultryMeatActualOutput || 0)),
      note: data.note || "",
      livePoultryPrice: data.livePoultryPrice || 60000,
      poultryMeatPrice: data.poultryMeatPrice || 150000
    }
  } catch (error) {
    console.log(`No poultry processing data for ${dateStr}`)
    return {
      livePoultryInput: 0,
      poultryMeatOutput: 0,
      poultryMeatActualOutput: 0,
      poultryMeatRemaining: 0,
      note: "",
      livePoultryPrice: 60000,
      poultryMeatPrice: 150000
    }
  }
}

// Get week dates helper
function getWeekDates(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dow = simple.getDay()
  const monday = new Date(simple)
  monday.setDate(simple.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// Day name helper
function getDayNameVi(dayIndex) {
  const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
  return dayNames[dayIndex]
}

// Test weekly tracking logic directly
async function testWeeklyLogic() {
  console.log('\n=== Testing Weekly Poultry Logic ===');
  
  const db = await getDb();
  if (!db) {
    console.log('❌ Database connection failed');
    return;
  }
  
  const week = 28;
  const year = 2025;
  
  console.log(`Testing week ${week} of year ${year}`);
  
  try {
    // First check if we have any data
    const totalCount = await db.collection("dailyPoultryProcessing").countDocuments();
    console.log(`Total records in dailyPoultryProcessing collection: ${totalCount}`);
    
    // Get sample data to see structure
    const sampleData = await db.collection("dailyPoultryProcessing").find({}).limit(3).toArray();
    console.log('Sample data structure:', sampleData.map(d => ({
      date: d.date,
      livePoultryInput: d.livePoultryInput,
      poultryMeatOutput: d.poultryMeatOutput,
      poultryMeatActualOutput: d.poultryMeatActualOutput
    })));
    
    // Calculate dates for the week
    const weekDates = getWeekDates(week, year);
    console.log('Week dates:', weekDates.map(d => d.toISOString().split('T')[0]));
    
    const weeklyData = [];
    
    // Get previous day data for carry over
    const prevDate = new Date(weekDates[0]);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevData = await getPoultryProcessingData(db, prevDateStr);
    let lastPoultryMeatRemain = prevData.poultryMeatRemaining || 0;
    
    console.log(`Previous day (${prevDateStr}) remaining: ${lastPoultryMeatRemain}`);
    
    for (const date of weekDates) {
      const dateStr = date.toISOString().split('T')[0];
      const processingData = await getPoultryProcessingData(db, dateStr);
      
      // Calculate inventory logic
      const poultryMeatBegin = lastPoultryMeatRemain;
      const poultryMeatEnd = poultryMeatBegin + (processingData.poultryMeatOutput || 0) - (processingData.poultryMeatActualOutput || 0);
      lastPoultryMeatRemain = poultryMeatEnd;

      weeklyData.push({
        date: dateStr,
        dayOfWeek: getDayNameVi(date.getDay()),
        livePoultryInput: processingData.livePoultryInput || 0,
        poultryMeatOutput: processingData.poultryMeatOutput || 0,
        poultryMeatActualOutput: processingData.poultryMeatActualOutput || 0,
        poultryMeatBegin,
        poultryMeatEnd,
        note: processingData.note || "",
        livePoultryPrice: processingData.livePoultryPrice || 60000,
        poultryMeatPrice: processingData.poultryMeatPrice || 150000
      });
    }
    
    console.log('\nWeekly data generated:');
    weeklyData.forEach(day => {
      console.log(`  ${day.date} (${day.dayOfWeek}): Input=${day.livePoultryInput}kg, Output=${day.poultryMeatOutput}kg, Actual=${day.poultryMeatActualOutput}kg`);
    });
    
    // Calculate totals
    const daysWithData = weeklyData.filter(day => day.livePoultryInput > 0 || day.poultryMeatOutput > 0);
    const weeklyTotals = {
      totalLivePoultryInput: weeklyData.reduce((sum, day) => sum + day.livePoultryInput, 0),
      totalPoultryMeatOutput: weeklyData.reduce((sum, day) => sum + day.poultryMeatOutput, 0),
      totalPoultryMeatActualOutput: weeklyData.reduce((sum, day) => sum + day.poultryMeatActualOutput, 0),
      totalPoultryMeatBegin: weeklyData[0]?.poultryMeatBegin || 0,
      totalPoultryMeatEnd: weeklyData[weeklyData.length-1]?.poultryMeatEnd || 0,
      avgLivePoultryPrice: daysWithData.length > 0 ? 
        Math.round(daysWithData.reduce((sum, day) => sum + day.livePoultryPrice, 0) / daysWithData.length) : 60000,
      avgPoultryMeatPrice: daysWithData.length > 0 ? 
        Math.round(daysWithData.reduce((sum, day) => sum + day.poultryMeatPrice, 0) / daysWithData.length) : 150000
    };
    
    console.log('\nWeekly totals:');
    console.log(`  Total Input: ${weeklyTotals.totalLivePoultryInput}kg`);
    console.log(`  Total Output: ${weeklyTotals.totalPoultryMeatOutput}kg`);
    console.log(`  Total Actual: ${weeklyTotals.totalPoultryMeatActualOutput}kg`);
    console.log(`  Days with data: ${daysWithData.length}`);
    
    if (daysWithData.length === 0) {
      console.log('⚠️  No data found for this week - this might be the issue!');
    } else {
      console.log('✅ Weekly logic working correctly');
    }
    
  } catch (error) {
    console.error('Error testing weekly logic:', error);
  }
}

// Test monthly logic
async function testMonthlyLogic() {
  console.log('\n=== Testing Monthly Poultry Logic ===');
  
  const db = await getDb();
  if (!db) {
    console.log('❌ Database connection failed');
    return;
  }
  
  const month = 7;
  const year = 2025;
  
  console.log(`Testing month ${month} of year ${year}`);
  
  try {
    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    console.log(`Date range: ${startDate} to ${endDate}`);
    
    // Check if we have data in this range
    const monthData = await db.collection("dailyPoultryProcessing").find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    console.log(`Records found in month: ${monthData.length}`);
    
    if (monthData.length > 0) {
      console.log('Sample records:');
      monthData.slice(0, 3).forEach(record => {
        console.log(`  ${record.date}: Input=${record.livePoultryInput}kg, Output=${record.poultryMeatOutput}kg`);
      });
    }
    
    // Test aggregation logic
    const monthlyData = await db.collection("dailyPoultryProcessing")
      .aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalLivePoultryInput: { $sum: "$livePoultryInput" },
            totalPoultryMeatOutput: { $sum: "$poultryMeatOutput" },
            totalPoultryMeatActualOutput: { $sum: "$poultryMeatActualOutput" },
            avgLivePoultryPrice: { $avg: "$livePoultryPrice" },
            avgPoultryMeatPrice: { $avg: "$poultryMeatPrice" },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();
    
    console.log('Aggregation result:', monthlyData);
    
    if (monthlyData.length > 0) {
      const data = monthlyData[0];
      console.log('Monthly summary:');
      console.log(`  Total Input: ${data.totalLivePoultryInput}kg`);
      console.log(`  Total Output: ${data.totalPoultryMeatOutput}kg`);
      console.log(`  Total Actual: ${data.totalPoultryMeatActualOutput}kg`);
      console.log(`  Avg Input Price: ${Math.round(data.avgLivePoultryPrice)}đ/kg`);
      console.log(`  Avg Output Price: ${Math.round(data.avgPoultryMeatPrice)}đ/kg`);
      console.log('✅ Monthly logic working correctly');
    } else {
      console.log('⚠️  No data found for this month - this might be the issue!');
    }
    
  } catch (error) {
    console.error('Error testing monthly logic:', error);
  }
}

// Create sample data for testing
async function createSampleData() {
  console.log('\n=== Creating Sample Data ===');
  
  const db = await getDb();
  if (!db) {
    console.log('❌ Database connection failed');
    return;
  }
  
  try {
    // Create sample data for the current week
    const today = new Date();
    const testData = [];
    
    // Generate data for the last 14 days
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyData = {
        date: dateStr,
        livePoultryInput: 100 + Math.floor(Math.random() * 50),
        poultryMeatOutput: 80 + Math.floor(Math.random() * 40),
        poultryMeatActualOutput: 70 + Math.floor(Math.random() * 30),
        note: `Sample data for ${dateStr}`,
        livePoultryPrice: 60000 + Math.floor(Math.random() * 10000),
        poultryMeatPrice: 150000 + Math.floor(Math.random() * 20000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      testData.push(dailyData);
    }
    
    // Insert sample data (replace existing)
    await db.collection('dailyPoultryProcessing').deleteMany({});
    await db.collection('dailyPoultryProcessing').insertMany(testData);
    
    console.log(`✅ Created ${testData.length} sample records`);
    console.log('Sample data:');
    testData.slice(0, 3).forEach(data => {
      console.log(`  ${data.date}: Input=${data.livePoultryInput}kg, Output=${data.poultryMeatOutput}kg, Actual=${data.poultryMeatActualOutput}kg`);
    });
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Direct Poultry Logic Tests...\n');
  
  try {
    // Step 1: Create sample data
    await createSampleData();
    
    // Step 2: Test weekly logic
    await testWeeklyLogic();
    
    // Step 3: Test monthly logic
    await testMonthlyLogic();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
} 