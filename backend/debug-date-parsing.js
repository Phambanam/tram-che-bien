require('dotenv').config();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;

async function debugDateParsing() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Get a user to create token
    const user = await db.collection('users').findOne({ role: 'admin' });
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('🔍 Testing different date formats...\n');
    
    // Test with actual date format from database
    const sampleOutput = await db.collection('supplyOutputs').findOne({});
    if (sampleOutput) {
      console.log('Sample output date from DB:', sampleOutput.outputDate);
      console.log('Sample output date ISO:', sampleOutput.outputDate.toISOString());
      console.log('Sample output date local:', sampleOutput.outputDate.toString());
    }
    
    // Test API with different date formats
    const testFormats = [
      '2025-06-30',
      '2025-06-30T00:00:00.000Z',
      '2025-06-30T00:00:00',
      '2025-06-30T17:00:00.000Z', // Vietnam timezone +7
    ];
    
    for (const dateFormat of testFormats) {
      console.log(`\n📅 Testing with format: ${dateFormat}`);
      
      const url = `http://localhost:5001/api/supply-outputs?startDate=${encodeURIComponent(dateFormat)}&endDate=${encodeURIComponent(dateFormat)}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Results: ${data.count} items`);
        
        if (data.count > 0) {
          console.log('✅ Found data with this format!');
          const sample = data.data[0];
          console.log(`Sample: ${sample.product.name} - ${sample.quantity}kg`);
          break;
        }
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
    }
    
    // Also test manually constructing the query like the API does
    console.log('\n🔍 Testing manual date construction...');
    
    const testDate = '2025-06-30';
    const apiStartDate = new Date(testDate);
    const apiEndDate = new Date(testDate);
    
    console.log('API would create dates:');
    console.log(`Start: ${apiStartDate.toISOString()}`);
    console.log(`End: ${apiEndDate.toISOString()}`);
    
    const manualQuery = {
      outputDate: {
        $gte: apiStartDate,
        $lte: apiEndDate
      }
    };
    
    const manualResults = await db.collection('supplyOutputs').find(manualQuery).toArray();
    console.log(`Manual query results: ${manualResults.length}`);
    
    // Try with end of day
    const endOfDay = new Date(testDate + 'T23:59:59.999Z');
    const eodQuery = {
      outputDate: {
        $gte: new Date(testDate),
        $lte: endOfDay
      }
    };
    
    const eodResults = await db.collection('supplyOutputs').find(eodQuery).toArray();
    console.log(`End of day query results: ${eodResults.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

debugDateParsing().catch(console.error);
