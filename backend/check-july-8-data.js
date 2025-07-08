const { MongoClient } = require('mongodb');

async function checkJuly8Data() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    // Define date range for July 8, 2025
    const targetDate = new Date('2025-07-08');
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    console.log(`📅 Checking supply outputs for July 8, 2025...`);
    console.log(`🕐 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}\n`);
    
    // Get all supply outputs for July 8, 2025
    const supplyOutputs = await db.collection('supplyOutputs')
      .aggregate([
        {
          $match: {
            outputDate: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $lookup: {
            from: 'units',
            localField: 'receivingUnit',
            foreignField: '_id',
            as: 'unitInfo'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$unitInfo'
        },
        {
          $unwind: '$productInfo'
        },
        {
          $project: {
            type: 1,
            quantity: 1,
            outputDate: 1,
            receiver: 1,
            status: 1,
            note: 1,
            unitName: '$unitInfo.name',
            productName: '$productInfo.name'
          }
        },
        {
          $sort: { outputDate: 1 }
        }
      ])
      .toArray();
    
    if (supplyOutputs.length === 0) {
      console.log('❌ No supply outputs found for July 8, 2025');
      console.log('💡 Please run the seed script: node seed-supply-outputs-july-8.js');
      return;
    }
    
    console.log(`✅ Found ${supplyOutputs.length} supply outputs for July 8, 2025\n`);
    
    // Group by type
    const actualOutputs = supplyOutputs.filter(o => o.type === 'actual');
    const plannedOutputs = supplyOutputs.filter(o => o.type === 'planned');
    
    console.log(`📊 Summary:`);
    console.log(`   - Actual outputs: ${actualOutputs.length}`);
    console.log(`   - Planned outputs: ${plannedOutputs.length}`);
    console.log(`   - Total: ${supplyOutputs.length}\n`);
    
    // Show detailed data
    console.log('📋 Detailed output list:');
    console.log('═'.repeat(100));
    
    supplyOutputs.forEach((output, index) => {
      const time = new Date(output.outputDate).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
      
      const typeIcon = output.type === 'actual' ? '✅' : '📋';
      const statusColor = output.status === 'completed' ? '🟢' : output.status === 'planned' ? '🔵' : '🟡';
      
      console.log(`${(index + 1).toString().padStart(2)}. ${typeIcon} ${output.productName.padEnd(15)} | ${output.quantity.toString().padStart(3)}kg | ${output.unitName.padEnd(12)} | ${output.receiver.padEnd(15)} | ${time} | ${statusColor} ${output.status}`);
    });
    
    console.log('═'.repeat(100));
    
    // Show total quantities by product
    const productTotals = {};
    supplyOutputs.forEach(output => {
      if (!productTotals[output.productName]) {
        productTotals[output.productName] = { actual: 0, planned: 0 };
      }
      if (output.type === 'actual') {
        productTotals[output.productName].actual += output.quantity;
      } else {
        productTotals[output.productName].planned += output.quantity;
      }
    });
    
    console.log('\n📦 Total quantities by product:');
    console.log('─'.repeat(60));
    Object.entries(productTotals).forEach(([product, totals]) => {
      console.log(`${product.padEnd(15)} | Actual: ${totals.actual.toString().padStart(3)}kg | Planned: ${totals.planned.toString().padStart(3)}kg | Total: ${(totals.actual + totals.planned).toString().padStart(3)}kg`);
    });
    console.log('─'.repeat(60));
    
    console.log('\n🎉 Data verification completed successfully!');
    console.log('💡 You can now test the "Quản lý nguồn xuất" functionality with July 8, 2025 data.');
    
  } catch (error) {
    console.error('❌ Error checking July 8 data:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkJuly8Data().catch(console.error); 