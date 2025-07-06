const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-should-be-very-long-and-random';

async function testWithRealToken() {
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
    
    console.log(`👤 Found user: ${user.fullName} (${user.email})`);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`🔑 Generated token: ${token.substring(0, 50)}...`);
    
    // Test API with this token
    const testDates = ['2025-06-30', '2025-07-01'];
    
    for (const date of testDates) {
      console.log(`\n📅 Testing ${date} with real token:`);
      
      const url = `http://localhost:5001/api/supply-outputs?startDate=${date}&endDate=${date}`;
      
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
        console.log(`✅ Success! Found ${data.count || data.length || 'unknown'} supply outputs`);
        
        if (data.data && data.data.length > 0) {
          const sample = data.data[0];
          console.log(`📋 Sample: ${sample.product.name} - ${sample.quantity}kg to ${sample.receivingUnit.name}`);
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

testWithRealToken().catch(console.error);
