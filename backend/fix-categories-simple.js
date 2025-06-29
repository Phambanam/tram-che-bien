const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function fixCategories() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Check existing categories
    const existingCategories = await db.collection('productCategories').find({}).toArray();
    console.log(`📋 Existing categories: ${existingCategories.length}`);
    
    // Find products with missing categories  
    const productsWithMissingCategories = await db.collection('products').aggregate([
      {
        $lookup: {
          from: "productCategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $match: {
          categoryInfo: { $size: 0 }
        }
      },
      {
        $project: {
          name: 1,
          category: 1
        }
      }
    ]).toArray();
    
    console.log(`\n🔍 Products with missing categories: ${productsWithMissingCategories.length}`);
    
    if (productsWithMissingCategories.length > 0) {
      console.log('Products with missing categories:');
      productsWithMissingCategories.forEach(p => {
        console.log(`  - ${p.name} (category: ${p.category})`);
      });
      
      // Get unique missing category IDs
      const missingCategoryIds = [...new Set(productsWithMissingCategories.map(p => p.category))];
      
      console.log(`\n✨ Creating ${missingCategoryIds.length} missing categories...`);
      
      // Create missing categories
      const categoriesToCreate = missingCategoryIds.map(categoryId => ({
        _id: categoryId,
        name: "Thực phẩm khác",
        description: "Danh mục tự động tạo cho sản phẩm thiếu danh mục", 
        slug: "thuc-pham-khac",
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.collection('productCategories').insertMany(categoriesToCreate);
      console.log('✅ Categories created successfully');
    }
    
    // Test the API query again
    console.log('\n🧪 Testing API query after fix...');
    const testResults = await db.collection('supplyOutputs')
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
    
    console.log(`🎉 API query now returns: ${testResults.length} results for 2025-06-30`);
    
    if (testResults.length > 0) {
      console.log('📋 Sample result:');
      const sample = testResults[0];
      console.log({
        product: sample.product.name,
        category: sample.product.category.name,
        unit: sample.receivingUnit.name,
        quantity: sample.quantity + 'kg',
        receiver: sample.receiver
      });
    }
    
    // Test a few more dates
    const testDates = ['2025-07-01', '2025-07-02'];
    for (const testDate of testDates) {
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
          { $unwind: "$unitInfo" },
          { $unwind: "$productInfo" },
          {
            $lookup: {
              from: "productCategories",
              localField: "productInfo.category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          { $unwind: "$categoryInfo" },
        ])
        .toArray();
      console.log(`📅 ${testDate}: ${results.length} results`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixCategories().catch(console.error);
