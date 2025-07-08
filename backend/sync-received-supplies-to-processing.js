const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function syncReceivedSuppliesToProcessing() {
  try {
    // Connect to MongoDB
    const client = new MongoClient('mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
    await client.connect();
    const db = client.db('military-logistics');
    
    console.log('Connected to MongoDB');
    
    // Get all received supplies that don't exist in processing station yet
    const receivedSupplies = await db.collection('supplies').find({ 
      status: 'received',
      actualQuantity: { $gt: 0 }
    }).toArray();
    
    console.log(`Found ${receivedSupplies.length} received supplies to sync`);
    
    for (const supply of receivedSupplies) {
      // Check if already exists in processing station
      const existingEntry = await db.collection('processingStation').findOne({
        sourceSupplyId: supply._id
      });
      
      if (existingEntry) {
        console.log(`Skipping supply ${supply._id} - already in processing station`);
        continue;
      }
      
      // Get product info
      const product = await db.collection('products').findOne({ code: supply.product });
      
      if (!product) {
        console.log(`Warning: Product not found for code: ${supply.product}`);
        continue;
      }
      
      // Create processing station entry
      const processingEntry = {
        type: "food",
        productId: product._id,
        productName: product.name,
        quantity: supply.actualQuantity,
        nonExpiredQuantity: supply.actualQuantity, // Initially all non-expired
        unit: product.unit || "kg",
        price: supply.price || 0,
        totalValue: supply.totalPrice || 0,
        expiryDate: supply.expiryDate,
        receivedDate: supply.updatedAt || supply.createdAt,
        stationEntryDate: supply.stationEntryDate,
        sourceSupplyId: supply._id,
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('processingStation').insertOne(processingEntry);
      
      console.log(`Added to processing station: ${product.name} - ${supply.actualQuantity}kg`);
    }
    
    console.log('Sync completed successfully!');
    await client.close();
    
  } catch (error) {
    console.error('Error syncing supplies:', error);
  }
}

// Run the sync
syncReceivedSuppliesToProcessing(); 