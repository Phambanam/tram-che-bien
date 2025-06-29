const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function fixMissingCategories() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Check existing categories
    const existingCategories = await db.collection('productCategories').find({}).toArray();
    console.log(`📋 Existing categories: ${existingCategories.length}`);
    existingCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat._id})`);
    });
    
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
      }
    ]).toArray();
    
    console.log(`\n🔍 Products with missing categories: ${productsWithMissingCategories.length}`);
    
    if (productsWithMissingCategories.length > 0) {
      // Create missing categories
      const missingCategoryIds = [...new Set(productsWithMissingCategories.map(p => p.category.toString()))];
      console.log('Missing category IDs:', missingCategoryIds);
      
      const categoriesToCreate = missingCategoryIds.map(id => ({
        _id: db.collection('products').findOne({category: id}).category,
        name: "Thực phẩm khác",
        description: "Danh mục tự động tạo cho sản phẩm thiếu danh mục",
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Get actual missing category objects
      const actualMissingCategories = [];
      for (const product of productsWithMissingCategories) {
        actualMissingCategories.push({
          _id: product.category,
          name: "Thực phẩm khác", 
          description: "Danh mục tự động tạo cho sản phẩm thiếu danh mục",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Remove duplicates
      const uniqueCategories = actualMissingCategories.reduce((acc, cat) => {
        const exists = acc.find(c => c._id.toString() === cat._id.toString());
        if (!exists) acc.push(cat);
        return acc;
      }, []);
      
      console.log(`\n✨ Creating ${uniqueCategories.length} missing categories...`);
      
      if (uniqueCategories.length > 0) {
        await db.collection('productCategories').insertMany(uniqueCategories);
        console.log('✅ Categories created successfully');
      }
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
    
    console.log(`🎉 API query now returns: ${testResults.length} results`);
    
    if (testResults.length > 0) {
      console.log('📋 Sample result:');
      const sample = testResults[0];
      console.log({
        product: sample.product.name,
        category: sample.product.category.name,
        unit: sample.receivingUnit.name,
        quantity: sample.quantity,
        date: sample.outputDate
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixMissingCategories().catch(console.error);
