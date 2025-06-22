const { MongoClient } = require('mongodb');

async function debugTofuIssue() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/military-logistics');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== DEBUGGING TOFU PROCESSING ISSUE ===\n');
    
    // 1. Check supplies collection for tofu/soybean data
    console.log('1. Checking supplies collection for tofu/soybean data:');
    const supplies = await db.collection('supplies').find({
      $or: [
        { "product": /đậu/i },
        { "category": /đậu/i }
      ]
    }).toArray();
    
    console.log(`Found ${supplies.length} supplies with "đậu" in product or category:`);
    supplies.forEach((supply, index) => {
      console.log(`  ${index + 1}. Product: ${supply.product}, Category: ${supply.category}, Quantity: ${supply.actualQuantity || supply.supplyQuantity}, Date: ${supply.stationEntryDate}`);
    });
    
    // 2. Check products collection for tofu products
    console.log('\n2. Checking products collection for tofu products:');
    const products = await db.collection('products').find({
      name: /đậu/i
    }).toArray();
    
    console.log(`Found ${products.length} products with "đậu" in name:`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ID: ${product._id}, Name: ${product.name}, Category: ${product.category}`);
    });
    
    // 3. Check supplyOutputs collection for tofu outputs
    console.log('\n3. Checking supplyOutputs collection for tofu outputs:');
    const supplyOutputs = await db.collection('supplyOutputs').aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: "$productInfo"
      },
      {
        $match: {
          "productInfo.name": /đậu/i
        }
      }
    ]).toArray();
    
    console.log(`Found ${supplyOutputs.length} supply outputs with tofu products:`);
    supplyOutputs.forEach((output, index) => {
      console.log(`  ${index + 1}. Product: ${output.productInfo.name}, Quantity: ${output.quantity}, Date: ${output.outputDate}`);
    });
    
    // 4. Check dailyTofuProcessing collection
    console.log('\n4. Checking dailyTofuProcessing collection:');
    const dailyTofuData = await db.collection('dailyTofuProcessing').find({}).sort({ date: -1 }).limit(5).toArray();
    
    console.log(`Found ${dailyTofuData.length} daily tofu processing records (latest 5):`);
    dailyTofuData.forEach((data, index) => {
      console.log(`  ${index + 1}. Date: ${data.date}, Soybean Input: ${data.soybeanInput}, Tofu Input: ${data.tofuInput}`);
    });
    
    // 5. Check processingStation collection for tofu type
    console.log('\n5. Checking processingStation collection for tofu items:');
    const processingStationTofu = await db.collection('processingStation').find({
      type: "tofu"
    }).toArray();
    
    console.log(`Found ${processingStationTofu.length} processing station items of type "tofu":`);
    processingStationTofu.forEach((item, index) => {
      console.log(`  ${index + 1}. Product ID: ${item.productId}, Quantity: ${item.quantity}, Processing Date: ${item.processingDate}`);
    });
    
    // 6. Get recent date queries to understand the date filtering
    console.log('\n6. Recent supplies with dates (latest 10):');
    const recentSupplies = await db.collection('supplies').find({}).sort({ stationEntryDate: -1 }).limit(10).toArray();
    
    recentSupplies.forEach((supply, index) => {
      console.log(`  ${index + 1}. Product: ${supply.product}, Date: ${supply.stationEntryDate}, Status: ${supply.status}`);
    });
    
    console.log('\n=== END DEBUG REPORT ===');
    
  } catch (error) {
    console.error('Error debugging tofu issue:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables if in Node.js environment
if (typeof require !== 'undefined') {
  require('dotenv').config();
}

debugTofuIssue(); 