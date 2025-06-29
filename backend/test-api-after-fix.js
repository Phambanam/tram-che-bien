const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function testAPIAfterFix() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Test a few dates with the same query as the API
    const testDates = ['2025-06-30', '2025-07-01', '2025-07-02'];
    
    for (const testDate of testDates) {
      console.log(`\n📅 Testing ${testDate}...`);
      
      const results = await db.collection('supplyOutputs')
        .aggregate([
          { 
            $match: { 
              outputDate: {
                $gte: new Date(testDate),
                $lte: new Date(testDate + 'T23:59:59.999Z')
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
              preserveNullAndEmptyArrays: true
            }
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
      
      console.log(`  Results: ${results.length}`);
      
      if (results.length > 0) {
        console.log('  Sample:', {
          product: results[0].product.name,
          category: results[0].product.category.name,
          quantity: results[0].quantity + 'kg',
          unit: results[0].receivingUnit.name
        });
        
        // Show total quantity
        const totalQuantity = results.reduce((sum, r) => sum + r.quantity, 0);
        console.log(`  Total quantity: ${totalQuantity}kg`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testAPIAfterFix().catch(console.error);
