const { MongoClient, ObjectId } = require('mongodb');
const { format, subDays } = require('date-fns');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function seedSupplies() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Get products
    const products = await db.collection('products').find({}).toArray();
    const categories = await db.collection('categories').find({}).toArray();
    const units = await db.collection('units').find({}).toArray();
    
    if (products.length === 0) {
      console.log('No products found! Please run seed-data-library.js first');
      return;
    }
    
    // Find or create tofu product
    let tofuProduct = products.find(p => p.name.toLowerCase().includes('đậu phụ'));
    if (!tofuProduct) {
      // Create tofu product if not exists
      const vegCategory = categories.find(c => c.name === 'Thực phẩm chế biến') || categories[0];
      const result = await db.collection('products').insertOne({
        name: 'Đậu phụ',
        categoryId: vegCategory._id,
        unit: 'kg',
        averagePrice: 25000,
        description: 'Đậu phụ tươi',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      tofuProduct = {
        _id: result.insertedId,
        name: 'Đậu phụ',
        categoryId: vegCategory._id,
        unit: 'kg',
        averagePrice: 25000
      };
      console.log('✅ Created tofu product');
    }
    
    // Create supplies for the past 30 days
    const supplies = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const supplyDate = subDays(today, i);
      const dateStr = format(supplyDate, 'yyyy-MM-dd');
      
      // Create 3-5 supplies per day
      const numSupplies = Math.floor(Math.random() * 3) + 3;
      
      for (let j = 0; j < numSupplies; j++) {
        // Random product
        const product = products[Math.floor(Math.random() * products.length)];
        
        // Higher chance for tofu supplies
        const useTofu = Math.random() < 0.3;
        const selectedProduct = useTofu ? tofuProduct : product;
        
        const quantity = Math.floor(Math.random() * 100) + 50;
        const unitPrice = selectedProduct.averagePrice || 10000;
        
        supplies.push({
          date: supplyDate,
          dateStr: dateStr,
          productId: selectedProduct._id,
          productName: selectedProduct.name,
          categoryId: selectedProduct.categoryId,
          quantity: quantity,
          unit: selectedProduct.unit,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice,
          supplier: ['Công ty TNHH Thực phẩm ABC', 'HTX Nông sản XYZ', 'Cửa hàng thực phẩm 123'][Math.floor(Math.random() * 3)],
          status: i < 20 ? 'approved' : 'pending',
          invoiceNumber: `HD${format(supplyDate, 'yyyyMMdd')}-${j + 1}`,
          notes: '',
          approvedBy: i < 20 ? units[0]._id : null,
          approvedAt: i < 20 ? new Date() : null,
          createdBy: units[0]._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Clear existing supplies
    await db.collection('supplies').deleteMany({});
    
    // Insert all supplies
    const result = await db.collection('supplies').insertMany(supplies);
    console.log(`✅ Created ${result.insertedCount} supply records`);
    
    // Count tofu supplies
    const tofuSupplyCount = supplies.filter(s => s.productName.toLowerCase().includes('đậu phụ')).length;
    console.log(`📦 Tofu supplies: ${tofuSupplyCount}`);
    
    // Create indexes for better performance
    await db.collection('supplies').createIndex({ date: -1 });
    await db.collection('supplies').createIndex({ productId: 1 });
    await db.collection('supplies').createIndex({ status: 1 });
    console.log('✅ Created indexes');
    
  } catch (error) {
    console.error('Error seeding supplies:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
seedSupplies().catch(console.error); 