require('dotenv').config();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;

async function debugAPIResponse() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Get a user to create token
    const user = await db.collection('users').findOne({ role: 'admin' });
    if (!user) {
      console.log('❌ No admin user found');
      return;
    }
    
    // Create JWT token exactly like the backend does
    const token = jwt.sign(
      { id: user._id.toString() },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    // Test multiple dates
    const testDates = ['2025-06-30', '2025-07-01', '2025-07-02'];
    
    for (const testDate of testDates) {
      console.log(`\n📅 Testing ${testDate}:`);
      
      const url = `http://localhost:5001/api/supply-outputs?startDate=${testDate}&endDate=${testDate}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Full response structure:');
        console.log(JSON.stringify(data, null, 2));
        
        // Check different possible data structures
        if (data.data && Array.isArray(data.data)) {
          console.log(`✅ Found ${data.data.length} supply outputs in data.data`);
          console.log(`📊 API returned count: ${data.count}`);
          
          if (data.data.length > 0) {
            const sample = data.data[0];
            console.log(`📋 Sample:`, {
              product: sample.product?.name || 'unknown',
              quantity: sample.quantity || 0,
              unit: sample.receivingUnit?.name || 'unknown',
              category: sample.product?.category?.name || 'unknown'
            });
          }
        } else if (Array.isArray(data)) {
          console.log(`✅ Found ${data.length} supply outputs in direct array`);
        } else {
          console.log('⚠️ Unexpected response structure');
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ Error: ${errorData}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

debugAPIResponse().catch(console.error);
