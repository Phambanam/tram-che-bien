const { MongoClient, ObjectId } = require('mongodb');

async function createSampleSupplyOutput() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔗 Connected to MongoDB');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    
    // Check if we have units
    const units = await db.collection('units').find({}).toArray();
    console.log('🏢 Available units:', units.map(u => ({ id: u._id, name: u.name })));
    
    // Check if we have products
    const products = await db.collection('products').find({}).toArray();
    console.log('📦 Available products:', products.map(p => ({ id: p._id, name: p.name })));
    
    // Find tofu product
    const tofuProduct = products.find(p => p.name.toLowerCase().includes('đậu phụ') || p.name.toLowerCase().includes('tofu'));
    if (!tofuProduct) {
      console.log('❌ No tofu product found. Creating one...');
      
      // Create a tofu product first
      const tofuId = new ObjectId();
      await db.collection('products').insertOne({
        _id: tofuId,
        name: 'Đậu phụ',
        unit: 'kg',
        category: new ObjectId(), // You might need to adjust this
        description: 'Đậu phụ trắng',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created tofu product:', tofuId);
    }
    
    // Find unit (prefer "Tiểu đoàn 1")
    const targetUnit = units.find(u => u.name.includes('Tiểu đoàn 1')) || units[0];
    if (!targetUnit) {
      console.log('❌ No units found');
      return;
    }
    
    const finalTofuProduct = tofuProduct || await db.collection('products').findOne({ name: 'Đậu phụ' });
    
    // Create sample supply output
    const sampleOutput = {
      type: 'actual',
      receivingUnit: targetUnit._id,
      productId: finalTofuProduct._id,
      quantity: 50, // 50kg đậu phụ
      outputDate: new Date(today),
      receiver: 'Test Receiver',
      status: 'completed',
      note: 'Sample tofu output for testing',
      createdBy: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('supplyOutputs').insertOne(sampleOutput);
    console.log('✅ Created sample supply output:', result.insertedId);
    console.log('📋 Sample data:', {
      unit: targetUnit.name,
      product: finalTofuProduct.name,
      quantity: sampleOutput.quantity,
      date: today
    });
    
    // Verify the data
    const verification = await db.collection('supplyOutputs')
      .aggregate([
        {
          $match: {
            outputDate: {
              $gte: new Date(today),
              $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'units',
            localField: 'receivingUnit',
            foreignField: '_id',
            as: 'unit'
          }
        }
      ])
      .toArray();
    
    console.log('🔍 Verification - Supply outputs for today:', verification.map(v => ({
      product: v.product[0]?.name,
      unit: v.unit[0]?.name,
      quantity: v.quantity,
      date: v.outputDate
    })));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createSampleSupplyOutput(); 