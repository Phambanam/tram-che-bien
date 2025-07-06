require('dotenv').config();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET;

async function testWithEnvToken() {
  if (!JWT_SECRET) {
    console.log('❌ JWT_SECRET not found in environment');
    return;
  }
  
  console.log(`🔑 Using JWT_SECRET: ${JWT_SECRET.substring(0, 20)}...`);
  
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
    
    // Create JWT token exactly like the backend does
    const token = jwt.sign(
      { id: user._id.toString() },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    console.log(`🔑 Generated token: ${token.substring(0, 50)}...`);
    
    // Test API with this token
    const testDate = '2025-06-30';
    
    console.log(`\n📅 Testing ${testDate} with env token:`);
    
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
      console.log(`✅ Success! Found ${data.count || data.length || 'unknown'} supply outputs`);
      
      if (data.data && data.data.length > 0) {
        const sample = data.data[0];
        console.log(`�� Sample: ${sample.product.name} - ${sample.quantity}kg to ${sample.receivingUnit.name}`);
        console.log(`📊 Total quantity: ${data.data.reduce((sum, item) => sum + item.quantity, 0)}kg`);
      }
    } else {
      const errorData = await response.text();
      console.log(`❌ Error: ${errorData}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testWithEnvToken().catch(console.error);
