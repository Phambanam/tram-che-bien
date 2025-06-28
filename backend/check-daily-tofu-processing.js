const { MongoClient } = require('mongodb');

async function checkDailyTofuProcessing() {
  const client = new MongoClient('mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military_logistics');
    const collection = db.collection('dailyTofuProcessing');
    
    // Count documents
    const count = await collection.countDocuments();
    console.log(`Total documents in dailyTofuProcessing: ${count}`);
    
    if (count > 0) {
      // Show some sample documents
      const samples = await collection.find({}).limit(5).toArray();
      console.log('\nSample documents:');
      samples.forEach((doc, index) => {
        console.log(`${index + 1}. Date: ${doc.date}, Soybean: ${doc.soybeanInput}kg, Tofu: ${doc.tofuInput}kg`);
      });
    } else {
      console.log('\n❌ No data found in dailyTofuProcessing collection');
      console.log('This explains why the API returns estimated/fallback data');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDailyTofuProcessing(); 