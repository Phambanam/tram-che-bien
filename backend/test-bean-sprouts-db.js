require('dotenv').config();
const { getDb } = require('./dist/config/database');

async function createBeanSproutsTestData() {
  try {
    const db = await getDb();
    console.log('🔗 Connected to MongoDB');

    const collection = db.collection('dailyBeanSproutsProcessing');

    console.log('🗑️ Clearing existing test data...');
    await collection.deleteMany({
      date: { $gte: '2025-01-13', $lte: '2025-01-17' }
    });

    console.log('📝 Creating sample bean sprouts processing data...');

    // Create data for a full week (2025-01-13 to 2025-01-17)
    const testData = [
      {
        date: '2025-01-13', // Monday
        soybeansInput: 100,
        beanSproutsInput: 280,
        beanSproutsOutput: 250,
        beanSproutsRemaining: 30,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 10,
        byProductPrice: 3000,
        otherCosts: 50000,
        note: 'Monday - Week test data',
        processingEfficiency: Math.round((280 / 100) * 100),
        // Financial calculations (in VND)
        beanSproutsRevenue: 280 * 8000,
        byProductRevenue: 10 * 3000,
        totalRevenue: (280 * 8000) + (10 * 3000),
        soybeansCost: 100 * 15000,
        totalCost: (100 * 15000) + 50000,
        netProfit: ((280 * 8000) + (10 * 3000)) - ((100 * 15000) + 50000),
        updatedAt: new Date()
      },
      {
        date: '2025-01-14', // Tuesday
        soybeansInput: 120,
        beanSproutsInput: 340,
        beanSproutsOutput: 310,
        beanSproutsRemaining: 30,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 12,
        byProductPrice: 3000,
        otherCosts: 60000,
        note: 'Tuesday - Week test data',
        processingEfficiency: Math.round((340 / 120) * 100),
        beanSproutsRevenue: 340 * 8000,
        byProductRevenue: 12 * 3000,
        totalRevenue: (340 * 8000) + (12 * 3000),
        soybeansCost: 120 * 15000,
        totalCost: (120 * 15000) + 60000,
        netProfit: ((340 * 8000) + (12 * 3000)) - ((120 * 15000) + 60000),
        updatedAt: new Date()
      },
      {
        date: '2025-01-15', // Wednesday
        soybeansInput: 90,
        beanSproutsInput: 250,
        beanSproutsOutput: 230,
        beanSproutsRemaining: 20,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 8,
        byProductPrice: 3000,
        otherCosts: 45000,
        note: 'Wednesday - Week test data',
        processingEfficiency: Math.round((250 / 90) * 100),
        beanSproutsRevenue: 250 * 8000,
        byProductRevenue: 8 * 3000,
        totalRevenue: (250 * 8000) + (8 * 3000),
        soybeansCost: 90 * 15000,
        totalCost: (90 * 15000) + 45000,
        netProfit: ((250 * 8000) + (8 * 3000)) - ((90 * 15000) + 45000),
        updatedAt: new Date()
      },
      {
        date: '2025-01-16', // Thursday
        soybeansInput: 110,
        beanSproutsInput: 320,
        beanSproutsOutput: 290,
        beanSproutsRemaining: 30,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 11,
        byProductPrice: 3000,
        otherCosts: 55000,
        note: 'Thursday - Week test data',
        processingEfficiency: Math.round((320 / 110) * 100),
        beanSproutsRevenue: 320 * 8000,
        byProductRevenue: 11 * 3000,
        totalRevenue: (320 * 8000) + (11 * 3000),
        soybeansCost: 110 * 15000,
        totalCost: (110 * 15000) + 55000,
        netProfit: ((320 * 8000) + (11 * 3000)) - ((110 * 15000) + 55000),
        updatedAt: new Date()
      },
      {
        date: '2025-01-17', // Friday
        soybeansInput: 95,
        beanSproutsInput: 270,
        beanSproutsOutput: 250,
        beanSproutsRemaining: 20,
        soybeansPrice: 15000,
        beanSproutsPrice: 8000,
        byProductQuantity: 9,
        byProductPrice: 3000,
        otherCosts: 48000,
        note: 'Friday - Week test data',
        processingEfficiency: Math.round((270 / 95) * 100),
        beanSproutsRevenue: 270 * 8000,
        byProductRevenue: 9 * 3000,
        totalRevenue: (270 * 8000) + (9 * 3000),
        soybeansCost: 95 * 15000,
        totalCost: (95 * 15000) + 48000,
        netProfit: ((270 * 8000) + (9 * 3000)) - ((95 * 15000) + 48000),
        updatedAt: new Date()
      }
    ];

    // Insert all test data
    const result = await collection.insertMany(testData);
    console.log(`✅ Created ${result.insertedCount} bean sprouts processing records`);

    // Verify the data
    console.log('\n📊 Verification - Sample data summary:');
    const verification = await collection.find({
      date: { $gte: '2025-01-13', $lte: '2025-01-17' }
    }).sort({ date: 1 }).toArray();

    verification.forEach(record => {
      console.log(`  📅 ${record.date}: ${record.beanSproutsInput}kg collected, ${Math.round(record.netProfit/1000)}k VND profit`);
    });

    // Calculate weekly totals
    const weeklyTotals = verification.reduce((totals, record) => ({
      totalSoybeansInput: totals.totalSoybeansInput + record.soybeansInput,
      totalBeanSproutsCollected: totals.totalBeanSproutsCollected + record.beanSproutsInput,
      totalBeanSproutsOutput: totals.totalBeanSproutsOutput + record.beanSproutsOutput,
      totalRevenue: totals.totalRevenue + record.totalRevenue,
      totalCost: totals.totalCost + record.totalCost,
      totalNetProfit: totals.totalNetProfit + record.netProfit
    }), {
      totalSoybeansInput: 0,
      totalBeanSproutsCollected: 0,
      totalBeanSproutsOutput: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalNetProfit: 0
    });

    console.log('\n📈 Weekly totals:');
    console.log(`  - Soybeans input: ${weeklyTotals.totalSoybeansInput} kg`);
    console.log(`  - Bean sprouts collected: ${weeklyTotals.totalBeanSproutsCollected} kg`);
    console.log(`  - Bean sprouts output: ${weeklyTotals.totalBeanSproutsOutput} kg`);
    console.log(`  - Total revenue: ${Math.round(weeklyTotals.totalRevenue/1000)} k VND`);
    console.log(`  - Total cost: ${Math.round(weeklyTotals.totalCost/1000)} k VND`);
    console.log(`  - Net profit: ${Math.round(weeklyTotals.totalNetProfit/1000)} k VND`);

    console.log('\n🎉 Bean sprouts test data created successfully!');
    console.log('\n💡 Now you can test the weekly and monthly views in the frontend.');
    console.log('   - Weekly: Week 3, Year 2025 (January 13-17)');
    console.log('   - Monthly: January 2025');

  } catch (error) {
    console.error('❌ Error creating bean sprouts test data:', error);
  }
}

// Run the script
createBeanSproutsTestData(); 