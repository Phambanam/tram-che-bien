const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function checkSupplyOutputs() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Check supplyOutputs collection
    const outputsCount = await db.collection('supplyOutputs').countDocuments();
    console.log(`\nSupply outputs in database: ${outputsCount}`);
    
    if (outputsCount > 0) {
      const sampleOutputs = await db.collection('supplyOutputs').find({}).limit(3).toArray();
      console.log('\nSample supply outputs:');
      sampleOutputs.forEach((output, index) => {
        console.log(`${index + 1}. Product: ${output.productName || output.productId} - Quantity: ${output.quantity} - Date: ${output.outputDate || output.date}`);
      });
      
      // Show first output structure
      console.log('\nFirst supply output structure:');
      console.log(JSON.stringify(sampleOutputs[0], null, 2));
      
      // Check date range
      const dateRange = await db.collection('supplyOutputs').aggregate([
        {
          $group: {
            _id: null,
            minDate: { $min: "$outputDate" },
            maxDate: { $max: "$outputDate" },
            minDateStr: { $min: "$dateStr" },
            maxDateStr: { $max: "$dateStr" }
          }
        }
      ]).toArray();
      
      if (dateRange.length > 0) {
        console.log('\nDate range in supply outputs:');
        console.log(JSON.stringify(dateRange[0], null, 2));
      }
    }
    
    // Test with date filter
    console.log('\n=== Testing date filters ===');
    const testDate = '2025-06-30';
    const filteredByOutputDate = await db.collection('supplyOutputs')
      .find({ 
        outputDate: {
          $gte: new Date(testDate),
          $lte: new Date(testDate + 'T23:59:59.999Z')
        }
      })
      .toArray();
    
    console.log(`Outputs for ${testDate} (using outputDate): ${filteredByOutputDate.length}`);
    
    const filteredByDateStr = await db.collection('supplyOutputs')
      .find({ dateStr: testDate })
      .toArray();
    
    console.log(`Outputs for ${testDate} (using dateStr): ${filteredByDateStr.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkSupplyOutputs().catch(console.error);
