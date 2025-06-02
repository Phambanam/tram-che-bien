// Script to directly check MongoDB contents
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  // MongoDB connection URL from env
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';
  
  // Parse database name from URI
  let dbName = 'military-logistics';
  const uriParts = uri.split('/');
  if (uriParts.length > 3) {
    dbName = uriParts[3].split('?')[0];
  }

  console.log(`Using database: ${dbName}`);
  
  // Create a new MongoDB client
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB server');

    // Get the database
    const db = client.db(dbName);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));

    // Check supplies collection
    const suppliesCollection = db.collection('supplies');
    const suppliesCount = await suppliesCollection.countDocuments();
    console.log(`\nSupplies collection has ${suppliesCount} documents`);

    if (suppliesCount > 0) {
      // Get a sample of supplies
      const supplies = await suppliesCollection.find({}).limit(5).toArray();
      console.log('Sample supplies:');
      supplies.forEach((supply, index) => {
        console.log(`\nSupply ${index + 1}:`);
        console.log(`- _id: ${supply._id}`);
        console.log(`- unit: ${supply.unit} (type: ${typeof supply.unit})`);
        console.log(`- category: ${supply.category} (type: ${typeof supply.category})`);
        console.log(`- product: ${supply.product} (type: ${typeof supply.product})`);
        console.log(`- status: ${supply.status}`);
        console.log(`- createdAt: ${supply.createdAt}`);
      });
    }

    // Check users collection for reference
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    console.log(`\nUsers collection has ${usersCount} documents`);

    if (usersCount > 0) {
      // Get user examples
      const users = await usersCollection.find({}).limit(3).toArray();
      console.log('Sample users:');
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`- _id: ${user._id}`);
        console.log(`- username: ${user.username}`);
        console.log(`- role: ${user.role}`);
        console.log(`- unit: ${user.unit} (type: ${typeof user.unit})`);
      });
    }

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

checkDatabase(); 