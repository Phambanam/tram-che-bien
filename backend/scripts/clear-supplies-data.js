const mongoose = require('mongoose');
require('dotenv').config();

async function clearSuppliesData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get the supplies collection
    const db = mongoose.connection.db;
    const suppliesCollection = db.collection('supplies');

    // Count documents before deletion
    const countBefore = await suppliesCollection.countDocuments();
    console.log(`Found ${countBefore} supplies in database`);

    if (countBefore > 0) {
      // Delete all supplies
      const result = await suppliesCollection.deleteMany({});
      console.log(`Deleted ${result.deletedCount} supplies`);
    } else {
      console.log('No supplies to delete');
    }

    // Verify deletion
    const countAfter = await suppliesCollection.countDocuments();
    console.log(`Supplies remaining: ${countAfter}`);

    console.log('Clear supplies data completed successfully');
  } catch (error) {
    console.error('Error clearing supplies data:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
clearSuppliesData(); 