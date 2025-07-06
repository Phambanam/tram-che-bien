const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function testDatabaseDirect() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    const testDate = '2025-06-30';
    console.log(`Testing date: ${testDate}`);
    
    // Test the exact same query as the API
    const query = {
      outputDate: {
        $gte: new Date(testDate),
        $lte: new Date(testDate + 'T23:59:59.999Z')
      }
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    // First test simple match
    const simpleResults = await db.collection('supplyOutputs')
      .find(query)
      .toArray();
    
    console.log(`Simple find results: ${simpleResults.length}`);
    
    if (simpleResults.length > 0) {
      console.log('Sample simple result:', {
        id: simpleResults[0]._id.toString(),
        productId: simpleResults[0].productId?.toString(),
        receivingUnit: simpleResults[0].receivingUnit?.toString(),
        quantity: simpleResults[0].quantity
      });
    }
    
    // Now test full aggregate pipeline like the API
    const aggregateResults = await db.collection('supplyOutputs')
      .aggregate([
        { $match: query },
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
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo",
          },
        },
        { $unwind: "$unitInfo" },
        { $unwind: "$productInfo" },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "productCategories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            receivingUnit: {
              id: { $toString: "$receivingUnit" },
              name: "$unitInfo.name",
            },
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
              category: {
                id: { $toString: "$categoryInfo._id" },
                name: { $ifNull: ["$categoryInfo.name", "Không xác định"] },
              },
            },
            quantity: 1,
            outputDate: 1,
            receiver: 1,
            status: 1,
            note: 1,
            createdBy: {
              $cond: [
                { $ifNull: ["$createdByInfo", false] },
                {
                  id: { $toString: "$createdBy" },
                  name: "$createdByInfo.fullName",
                },
                null,
              ],
            },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { outputDate: -1 } },
      ])
      .toArray();
    
    console.log(`Aggregate results: ${aggregateResults.length}`);
    
    if (aggregateResults.length > 0) {
      console.log('Sample aggregate result:', {
        product: aggregateResults[0].product.name,
        quantity: aggregateResults[0].quantity,
        unit: aggregateResults[0].receivingUnit.name,
        category: aggregateResults[0].product.category.name
      });
    } else {
      console.log('❌ Aggregate pipeline returned 0 results');
      
      // Debug each step
      console.log('\n🔍 Debugging pipeline steps...');
      
      // Step 1: After match
      const step1 = await db.collection('supplyOutputs')
        .aggregate([{ $match: query }])
        .toArray();
      console.log(`After match: ${step1.length} results`);
      
      // Step 2: After unit lookup
      const step2 = await db.collection('supplyOutputs')
        .aggregate([
          { $match: query },
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
      console.log(`After unit lookup: ${step2.length} results`);
      if (step2.length > 0) {
        console.log(`Unit lookup success: ${step2[0].unitInfo.length > 0 ? '✅' : '❌'}`);
      }
      
      // Step 3: After unit unwind
      const step3 = await db.collection('supplyOutputs')
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: "units",
              localField: "receivingUnit",
              foreignField: "_id",
              as: "unitInfo",
            },
          },
          { $unwind: "$unitInfo" },
        ])
        .toArray();
      console.log(`After unit unwind: ${step3.length} results`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testDatabaseDirect().catch(console.error);
