const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function debugSupplyOutputStructure() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Get a sample supply output for 2025-06-30
    const sampleOutput = await db.collection('supplyOutputs')
      .findOne({ 
        outputDate: {
          $gte: new Date('2025-06-30'),
          $lte: new Date('2025-06-30T23:59:59.999Z')
        }
      });
    
    if (!sampleOutput) {
      console.log('❌ No supply output found for 2025-06-30');
      return;
    }
    
    console.log('📋 Sample supply output structure:');
    console.log(JSON.stringify(sampleOutput, null, 2));
    
    // Check if related documents exist
    console.log('\n🔍 Checking related documents...');
    
    // Check unit
    const unit = await db.collection('units').findOne({ _id: sampleOutput.receivingUnit });
    console.log(`Unit (${sampleOutput.receivingUnit}):`, unit ? unit.name : '❌ NOT FOUND');
    
    // Check product
    const product = await db.collection('products').findOne({ _id: sampleOutput.productId });
    console.log(`Product (${sampleOutput.productId}):`, product ? product.name : '❌ NOT FOUND');
    
    // Check user
    const user = await db.collection('users').findOne({ _id: sampleOutput.createdBy });
    console.log(`User (${sampleOutput.createdBy}):`, user ? user.fullName : '❌ NOT FOUND');
    
    // Check product category if product exists
    if (product && product.category) {
      const category = await db.collection('productCategories').findOne({ _id: product.category });
      console.log(`Category (${product.category}):`, category ? category.name : '❌ NOT FOUND');
    }
    
    // Now test step by step pipeline
    console.log('\n🧪 Testing aggregate pipeline step by step...');
    
    // Step 1: Match
    const matchResults = await db.collection('supplyOutputs')
      .find({ 
        outputDate: {
          $gte: new Date('2025-06-30'),
          $lte: new Date('2025-06-30T23:59:59.999Z')
        }
      })
      .toArray();
    console.log(`Step 1 - Match: ${matchResults.length} results`);
    
    // Step 2: Add unit lookup
    const withUnits = await db.collection('supplyOutputs')
      .aggregate([
        { 
          $match: { 
            outputDate: {
              $gte: new Date('2025-06-30'),
              $lte: new Date('2025-06-30T23:59:59.999Z')
            }
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo",
          },
        }
      ])
      .toArray();
    console.log(`Step 2 - With units: ${withUnits.length} results`);
    if (withUnits.length > 0) {
      console.log(`  Unit lookup success: ${withUnits[0].unitInfo.length > 0 ? '✅' : '❌'}`);
    }
    
    // Step 3: Add product lookup
    const withProducts = await db.collection('supplyOutputs')
      .aggregate([
        { 
          $match: { 
            outputDate: {
              $gte: new Date('2025-06-30'),
              $lte: new Date('2025-06-30T23:59:59.999Z')
            }
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        }
      ])
      .toArray();
    console.log(`Step 3 - With products: ${withProducts.length} results`);
    if (withProducts.length > 0) {
      console.log(`  Product lookup success: ${withProducts[0].productInfo.length > 0 ? '✅' : '❌'}`);
    }
    
    // Test unwind operations
    const withUnwinds = await db.collection('supplyOutputs')
      .aggregate([
        { 
          $match: { 
            outputDate: {
              $gte: new Date('2025-06-30'),
              $lte: new Date('2025-06-30T23:59:59.999Z')
            }
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "receivingUnit",
            foreignField: "_id",
            as: "unitInfo",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$unitInfo" },
        { $unwind: "$productInfo" },
      ])
      .toArray();
    console.log(`Step 4 - After unwinds: ${withUnwinds.length} results`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

debugSupplyOutputStructure().catch(console.error);
