const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearDishes() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dishesCollection = db.collection('dishes');
    
    // Get current count
    const currentCount = await dishesCollection.countDocuments();
    console.log(`Current dishes count: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('No dishes to clear.');
      return;
    }
    
    // Ask for confirmation (simulate with environment variable)
    const shouldClear = process.env.FORCE_CLEAR === 'true' || process.argv.includes('--force');
    
    if (!shouldClear) {
      console.log('\n⚠️  WARNING: This will delete ALL dishes from the database!');
      console.log('To proceed, run with --force flag or set FORCE_CLEAR=true environment variable');
      console.log('Example: npm run clear-dishes -- --force');
      return;
    }
    
    // Clear all dishes
    const result = await dishesCollection.deleteMany({});
    
    console.log(`\n✅ Successfully cleared ${result.deletedCount} dishes from database!`);
    
  } catch (error) {
    console.error('Error clearing dishes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  console.log('🗑️  Starting dish clearing...\n');
  clearDishes().catch(console.error);
}

module.exports = { clearDishes }; 