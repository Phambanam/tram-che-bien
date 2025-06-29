const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function testSupplyOutputsAPI() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Test different date formats
    const testDates = [
      '2025-06-30',
      '2025-07-01',
      '2025-07-02'
    ];
    
    console.log('🔍 Testing supply outputs API simulation...\n');
    
    for (const testDate of testDates) {
      console.log(`📅 Testing date: ${testDate}`);
      
      // Test exact same query as API
      const startDate = new Date(testDate);
      const endDate = new Date(testDate + 'T23:59:59.999Z');
      
      console.log(`Query range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const query = {
        outputDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      const results = await db.collection('supplyOutputs')
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
          { $unwind: "$categoryInfo" },
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
                  name: "$categoryInfo.name",
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
      
      console.log(`✅ Found ${results.length} supply outputs`);
      
      if (results.length > 0) {
        console.log('📋 Sample result:');
        const sample = results[0];
        console.log({
          id: sample.id,
          product: sample.product.name,
          unit: sample.receivingUnit.name,
          quantity: sample.quantity,
          date: sample.outputDate
        });
      }
      
      console.log('---\n');
    }
    
    // Show actual data in database by date
    console.log('📊 Actual data in database by date:');
    const dateGroups = await db.collection('supplyOutputs').aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$outputDate" }
          },
          count: { $sum: 1 },
          sampleOutput: { $first: "$$ROOT" }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();
    
    dateGroups.forEach(group => {
      console.log(`${group._id}: ${group.count} outputs (Sample: ${group.sampleOutput.quantity}kg to ${group.sampleOutput.receiver})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testSupplyOutputsAPI().catch(console.error);
