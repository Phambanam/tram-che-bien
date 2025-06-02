// Direct MongoDB query script
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function queryDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';
  console.log(`Using URI: ${uri}`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Direct query of supplies collection
    const supplies = await db.collection('supplies').find({}).toArray();
    console.log(`Found ${supplies.length} supplies`);
    
    // Insert a test supply to make sure we have write access
    const result = await db.collection('supplies').insertOne({
      unit: new ObjectId('683c1e6b3c5cf22a7084550a'),
      category: 'test-category',
      product: 'test-product',
      supplyQuantity: 10,
      expectedHarvestDate: new Date(),
      status: 'pending',
      createdBy: new ObjectId('683c1e6c3c5cf22a70845533'),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Inserted test supply with ID: ${result.insertedId}`);
    
    // Delete the test supply
    await db.collection('supplies').deleteOne({ _id: result.insertedId });
    console.log('Deleted test supply');
    
    // Query again to confirm count
    const suppliesAfter = await db.collection('supplies').find({}).toArray();
    console.log(`Found ${suppliesAfter.length} supplies after test`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

queryDatabase(); 