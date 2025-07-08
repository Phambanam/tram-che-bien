const { MongoClient, ObjectId } = require('mongodb');

async function seedSupplyOutputsJuly8() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data for July 8, 2025
    const targetDate = new Date('2025-07-08');
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    console.log('🧹 Clearing existing supply outputs for July 8, 2025...');
    const deleteResult = await db.collection('supplyOutputs').deleteMany({
      outputDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing supply outputs for July 8, 2025`);
    
    // Get units and products
    console.log('📋 Fetching units and products...');
    const units = await db.collection('units').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const users = await db.collection('users').find({}).limit(1).toArray();
    
    if (units.length === 0) {
      console.log('❌ No units found. Please seed units first.');
      return;
    }
    
    if (products.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }
    
    console.log(`Found ${units.length} units and ${products.length} products`);
    
    // Create sample supply outputs for July 8, 2025
    const supplyOutputs = [];
    const july8Date = new Date('2025-07-08T07:00:00.000Z');
    
    // Sample outputs for different times of day
    const sampleOutputs = [
      {
        time: '07:00:00',
        products: ['Thịt lợn', 'Rau xanh', 'Gạo tẻ'],
        quantities: [50, 30, 100],
        receivers: ['Nguyễn Văn Nam', 'Trần Thị Hoa', 'Lê Văn Sơn']
      },
      {
        time: '10:30:00',
        products: ['Thịt gà', 'Cá', 'Đậu phụ'],
        quantities: [25, 40, 15],
        receivers: ['Phạm Văn Dũng', 'Hoàng Thị Mai', 'Vũ Văn Toàn']
      },
      {
        time: '14:15:00',
        products: ['Rau củ', 'Gia vị', 'Dầu ăn'],
        quantities: [35, 10, 20],
        receivers: ['Đỗ Thị Lan', 'Bùi Văn Huy', 'Ngô Thị Thu']
      },
      {
        time: '16:45:00',
        products: ['Thịt bò', 'Rau xanh', 'Gạo tẻ'],
        quantities: [30, 25, 80],
        receivers: ['Lý Văn Tuấn', 'Trịnh Thị Nga', 'Đinh Văn Minh']
      }
    ];
    
    const createdBy = users.length > 0 ? users[0]._id : new ObjectId();
    
    for (let i = 0; i < sampleOutputs.length; i++) {
      const sample = sampleOutputs[i];
      const outputTime = new Date(`2025-07-08T${sample.time}.000Z`);
      const receivingUnit = units[i % units.length];
      
      for (let j = 0; j < sample.products.length; j++) {
        const productName = sample.products[j];
        const product = products.find(p => p.name.includes(productName.split(' ')[0]) || 
                                          p.name.toLowerCase().includes(productName.toLowerCase()));
        
        if (product) {
          supplyOutputs.push({
            type: 'actual',
            receivingUnit: receivingUnit._id,
            productId: product._id,
            quantity: sample.quantities[j],
            outputDate: outputTime,
            receiver: sample.receivers[j],
            status: 'completed',
            note: `Xuất kho ngày 08/07/2025 - ${sample.time.substring(0, 5)}`,
            createdBy: createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Add some planned outputs for comparison
    const plannedOutputs = [];
    for (let i = 0; i < 5; i++) {
      const randomUnit = units[Math.floor(Math.random() * units.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const plannedTime = new Date(`2025-07-08T${8 + i * 2}:00:00.000Z`);
      
      plannedOutputs.push({
        type: 'planned',
        receivingUnit: randomUnit._id,
        productId: randomProduct._id,
        quantity: Math.floor(Math.random() * 50) + 10,
        outputDate: plannedTime,
        receiver: 'Kế hoạch',
        status: 'planned',
        note: 'Xuất kho theo kế hoạch tuần 28/2025',
        planningWeek: 28,
        planningYear: 2025,
        createdBy: createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Combine actual and planned outputs
    const allOutputs = [...supplyOutputs, ...plannedOutputs];
    
    if (allOutputs.length > 0) {
      console.log('📦 Inserting supply outputs...');
      const result = await db.collection('supplyOutputs').insertMany(allOutputs);
      console.log(`✅ Created ${result.insertedCount} supply outputs for July 8, 2025`);
      
      // Show summary
      console.log('\n📊 Summary by type:');
      console.log(`   - Actual outputs: ${supplyOutputs.length}`);
      console.log(`   - Planned outputs: ${plannedOutputs.length}`);
      console.log(`   - Total: ${allOutputs.length}`);
      
      // Show sample data
      console.log('\n📋 Sample outputs created:');
      for (let i = 0; i < Math.min(5, supplyOutputs.length); i++) {
        const output = supplyOutputs[i];
        const unit = units.find(u => u._id.equals(output.receivingUnit));
        const product = products.find(p => p._id.equals(output.productId));
        console.log(`   - ${product?.name || 'Unknown'}: ${output.quantity}kg → ${unit?.name || 'Unknown'} (${output.receiver})`);
      }
    } else {
      console.log('❌ No outputs created. Check if products and units exist.');
    }
    
  } catch (error) {
    console.error('❌ Error seeding supply outputs:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedSupplyOutputsJuly8().catch(console.error); 