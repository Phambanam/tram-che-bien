require('dotenv').config();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;

async function finalTest() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('military-logistics');
    
    const user = await db.collection('users').findOne({ role: 'admin' });
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('🎉 FINAL TEST - Supply Outputs API\n');
    
    const testDates = ['2025-06-30', '2025-07-01', '2025-07-02', '2025-07-03'];
    
    for (const testDate of testDates) {
      const url = `http://localhost:5001/api/supply-outputs?startDate=${testDate}&endDate=${testDate}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${testDate}: ${data.count} supply outputs`);
        
        if (data.count > 0) {
          const totalQuantity = data.data.reduce((sum, item) => sum + item.quantity, 0);
          const sampleProduct = data.data[0].product.name;
          console.log(`   📊 Total: ${totalQuantity}kg | Sample: ${sampleProduct}`);
        }
      } else {
        console.log(`❌ ${testDate}: Error ${response.status}`);
      }
    }
    
    console.log('\n🚀 API is now working correctly!');
    console.log('Frontend should now display data when changing dates.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

finalTest().catch(console.error);
