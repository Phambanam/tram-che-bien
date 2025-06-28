const { MongoClient } = require('mongodb');

async function seedDailyTofuProcessing() {
  const client = new MongoClient('mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military_logistics');
    const collection = db.collection('dailyTofuProcessing');
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing data');
    
    const documents = [];
    const startDate = new Date(2024, 7, 1); // August 1, 2024
    const endDate = new Date(); // Today
    
    // Generate daily data from start date to today
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Skip some days randomly to make it more realistic
      if (Math.random() < 0.15) continue; // Skip ~15% of days
      
      // Generate realistic data with some patterns
      const baseQuantity = 150 + Math.sin(d.getTime() / 86400000 / 7) * 50; // Weekly pattern
      const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% variation
      
      const soybeanInput = Math.round(baseQuantity * randomFactor);
      const tofuInput = Math.round(soybeanInput * (0.75 + Math.random() * 0.15)); // 75-90% efficiency
      const tofuOutput = Math.round(tofuInput * (0.85 + Math.random() * 0.1)); // 85-95% output rate
      
      documents.push({
        date: dateStr,
        soybeanInput: soybeanInput,
        tofuInput: tofuInput,
        tofuOutput: tofuOutput,
        tofuRemaining: tofuInput - tofuOutput,
        note: Math.random() < 0.1 ? "Chế biến thêm giờ" : "", // 10% chance of note
        soybeanPrice: 12000 + Math.round(Math.random() * 2000), // 12-14k VND/kg
        tofuPrice: 15000 + Math.round(Math.random() * 3000), // 15-18k VND/kg
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Insert all documents
    const result = await collection.insertMany(documents);
    console.log(`✅ Inserted ${result.insertedCount} documents`);
    
    // Show summary by month
    const summary = await collection.aggregate([
      {
        $group: {
          _id: {
            year: { $year: { $dateFromString: { dateString: "$date" } } },
            month: { $month: { $dateFromString: { dateString: "$date" } } }
          },
          count: { $sum: 1 },
          totalSoybeanInput: { $sum: "$soybeanInput" },
          totalTofuInput: { $sum: "$tofuInput" },
          totalTofuOutput: { $sum: "$tofuOutput" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]).toArray();
    
    console.log('\n📊 Monthly Summary:');
    summary.forEach(month => {
      console.log(`${month._id.month.toString().padStart(2, '0')}/${month._id.year}: ${month.count} days, ${month.totalSoybeanInput}kg soybean → ${month.totalTofuInput}kg tofu`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

seedDailyTofuProcessing(); 