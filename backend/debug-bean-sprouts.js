const { MongoClient } = require('mongodb')

async function debugBeanSprouts() {
  const client = new MongoClient('mongodb://localhost:27017')
  await client.connect()
  const db = client.db('militarylogistics')
  
  console.log('=== BEAN SPROUTS DEBUG ===')
  
  // Check available data in dailyTofuProcessing for July 2025
  console.log('\n1. Checking dailyTofuProcessing collection for July 2025:')
  const tofuData = await db.collection('dailyTofuProcessing')
    .find({ date: { $gte: '2025-07-01', $lte: '2025-07-31' } })
    .sort({ date: 1 })
    .toArray()
    
  console.log(`Found ${tofuData.length} records in dailyTofuProcessing:`)
  tofuData.forEach(record => {
    console.log(`  ${record.date}: soybeanInput=${record.soybeanInput}, tofuInput=${record.tofuInput}, tofuOutput=${record.tofuOutput}`)
  })

  // Test specific date (2025-07-02) 
  const specificDate = '2025-07-02'
  console.log(`\n2. Testing specific date: ${specificDate}`)
  
  const dayData = await db.collection('dailyTofuProcessing').findOne({ date: specificDate })
  if (dayData) {
    console.log('  Daily data found:', {
      soybeanInput: dayData.soybeanInput,
      tofuInput: dayData.tofuInput,
      tofuOutput: dayData.tofuOutput,
      soybeanPrice: dayData.soybeanPrice,
      tofuPrice: dayData.tofuPrice
    })
  } else {
    console.log('  No daily data found')
  }

  // Test week 27, 2025 data
  console.log('\n3. Testing Week 27, 2025 (covering July 2025):')
  const weekDates = [
    '2025-06-30', '2025-07-01', '2025-07-02', '2025-07-03', 
    '2025-07-04', '2025-07-05', '2025-07-06'
  ]
  
  for (const date of weekDates) {
    const data = await db.collection('dailyTofuProcessing').findOne({ date })
    const status = data ? `✓ Has data (soybean: ${data.soybeanInput}, tofu: ${data.tofuInput})` : '✗ No data'
    console.log(`  ${date}: ${status}`)
  }

  // Test July 2025 monthly data
  console.log('\n4. Testing July 2025 monthly aggregation:')
  const monthlyAgg = await db.collection('dailyTofuProcessing')
    .aggregate([
      {
        $match: {
          date: { $gte: '2025-07-01', $lte: '2025-07-31' }
        }
      },
      {
        $group: {
          _id: null,
          totalSoybeansInput: { $sum: '$soybeanInput' },
          totalBeanSproutsCollected: { $sum: '$tofuInput' },
          totalBeanSproutsOutput: { $sum: '$tofuOutput' },
          count: { $sum: 1 }
        }
      }
    ])
    .toArray()
    
  if (monthlyAgg.length > 0) {
    console.log('  Monthly aggregation result:', monthlyAgg[0])
  } else {
    console.log('  No monthly data available')
  }

  // Check if wrong collection exists
  console.log('\n5. Checking wrong collection (dailyBeanSproutsProcessing):')
  const wrongCollection = await db.collection('dailyBeanSproutsProcessing').find().limit(5).toArray()
  console.log(`  Found ${wrongCollection.length} records in dailyBeanSproutsProcessing`)

  await client.close()
  console.log('\n=== DEBUG COMPLETE ===')
}

debugBeanSprouts().catch(console.error) 