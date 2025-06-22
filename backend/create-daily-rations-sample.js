const { MongoClient, ObjectId } = require('mongodb');

async function createDailyRationsSample() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/military-logistics');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== CREATING DAILY RATIONS SAMPLE DATA ===\n');
    
    // Sample daily rations based on military standards
    const sampleRations = [
      {
        _id: "gao-te",
        name: "Gạo tẻ",
        categoryId: "luong-thuc",
        categoryName: "Lương thực",
        quantityPerPerson: 0.6, // 600g per person
        unit: "kg",
        pricePerUnit: 20000, // 20,000 VND per kg
        totalCostPerPerson: 12000,
        notes: "Gạo tẻ chất lượng tốt"
      },
      {
        _id: "thit-heo",
        name: "Thịt heo",
        categoryId: "thit-gia-suc",
        categoryName: "Thịt gia súc",
        quantityPerPerson: 0.15, // 150g per person
        unit: "kg",
        pricePerUnit: 120000, // 120,000 VND per kg
        totalCostPerPerson: 18000,
        notes: "Thịt heo tươi"
      },
      {
        _id: "ca-tra",
        name: "Cá tra",
        categoryId: "hai-san",
        categoryName: "Hải sản",
        quantityPerPerson: 0.1, // 100g per person
        unit: "kg",
        pricePerUnit: 80000, // 80,000 VND per kg
        totalCostPerPerson: 8000,
        notes: "Cá tra tươi"
      },
      {
        _id: "rau-muong",
        name: "Rau muống",
        categoryId: "rau-cu-qua",
        categoryName: "Rau củ quả",
        quantityPerPerson: 0.2, // 200g per person
        unit: "kg",
        pricePerUnit: 15000, // 15,000 VND per kg
        totalCostPerPerson: 3000,
        notes: "Rau muống tươi"
      },
      {
        _id: "ca-chua",
        name: "Cà chua",
        categoryId: "rau-cu-qua",
        categoryName: "Rau củ quả",
        quantityPerPerson: 0.1, // 100g per person
        unit: "kg",
        pricePerUnit: 25000, // 25,000 VND per kg
        totalCostPerPerson: 2500,
        notes: "Cà chua tươi"
      },
      {
        _id: "dau-phu",
        name: "Đậu phụ",
        categoryId: "dau-hat",
        categoryName: "Đậu hạt",
        quantityPerPerson: 0.08, // 80g per person
        unit: "kg",
        pricePerUnit: 30000, // 30,000 VND per kg
        totalCostPerPerson: 2400,
        notes: "Đậu phụ tươi"
      },
      {
        _id: "dau-an",
        name: "Dầu ăn",
        categoryId: "gia-vi",
        categoryName: "Gia vị",
        quantityPerPerson: 0.03, // 30g per person
        unit: "kg",
        pricePerUnit: 60000, // 60,000 VND per kg
        totalCostPerPerson: 1800,
        notes: "Dầu ăn thực vật"
      },
      {
        _id: "muoi",
        name: "Muối",
        categoryId: "gia-vi",
        categoryName: "Gia vị",
        quantityPerPerson: 0.01, // 10g per person
        unit: "kg",
        pricePerUnit: 8000, // 8,000 VND per kg
        totalCostPerPerson: 80,
        notes: "Muối ăn"
      },
      {
        _id: "duong",
        name: "Đường",
        categoryId: "gia-vi",
        categoryName: "Gia vị",
        quantityPerPerson: 0.02, // 20g per person
        unit: "kg",
        pricePerUnit: 18000, // 18,000 VND per kg
        totalCostPerPerson: 360,
        notes: "Đường trắng"
      },
      {
        _id: "nuoc-mam",
        name: "Nước mắm",
        categoryId: "gia-vi",
        categoryName: "Gia vị",
        quantityPerPerson: 0.005, // 5g per person
        unit: "kg",
        pricePerUnit: 100000, // 100,000 VND per kg
        totalCostPerPerson: 500,
        notes: "Nước mắm truyền thống"
      }
    ];
    
    // Create categories first
    console.log('1. Creating categories...');
    const categories = [
      { _id: "luong-thuc", name: "Lương thực", slug: "luong-thuc" },
      { _id: "thit-gia-suc", name: "Thịt gia súc", slug: "thit-gia-suc" },
      { _id: "hai-san", name: "Hải sản", slug: "hai-san" },
      { _id: "rau-cu-qua", name: "Rau củ quả", slug: "rau-cu-qua" },
      { _id: "dau-hat", name: "Đậu hạt", slug: "dau-hat" },
      { _id: "gia-vi", name: "Gia vị", slug: "gia-vi" }
    ];
    
    let categoriesCreated = 0;
    for (const category of categories) {
      const existing = await db.collection('productCategories').findOne({ _id: category._id });
      if (!existing) {
        await db.collection('productCategories').insertOne({
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        categoriesCreated++;
      }
    }
    console.log(`   ✓ Created ${categoriesCreated} categories`);
    
    // Create daily rations
    console.log('\n2. Creating daily rations...');
    let rationsCreated = 0;
    
    for (const ration of sampleRations) {
      const existing = await db.collection('dailyRations').findOne({ _id: ration._id });
      if (!existing) {
        await db.collection('dailyRations').insertOne({
          ...ration,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        rationsCreated++;
      }
    }
    
    console.log(`   ✓ Created ${rationsCreated} daily rations`);
    
    // Verify data
    console.log('\n3. Verifying data...');
    const totalCategories = await db.collection('productCategories').countDocuments();
    const totalRations = await db.collection('dailyRations').countDocuments();
    
    console.log(`   ✓ Total categories: ${totalCategories}`);
    console.log(`   ✓ Total daily rations: ${totalRations}`);
    
    // Calculate total cost per person per day
    const totalCostPerDay = sampleRations.reduce((sum, ration) => sum + ration.totalCostPerPerson, 0);
    console.log(`   ✓ Total cost per person per day: ${totalCostPerDay.toLocaleString()} VND`);
    
    console.log('\n=== DAILY RATIONS SAMPLE DATA CREATED ===');
    console.log('Now both menu planning (primary) and daily rations (fallback) data are available');
    
  } catch (error) {
    console.error('Error creating daily rations sample data:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
if (typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('dotenv not available, using default connection');
  }
}

createDailyRationsSample(); 