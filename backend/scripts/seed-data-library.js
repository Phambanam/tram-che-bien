const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function seedDataLibrary() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('units').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('dishes').deleteMany({});
    await db.collection('dailyRations').deleteMany({});
    
    // Seed Units
    console.log('Seeding units...');
    const units = [
      {
        _id: new ObjectId(),
        name: "Tiểu đoàn 1",
        code: "TD01",
        personnel: 150,
        commander: "Thiếu tá Nguyễn Văn A",
        contact: "0987654321",
        description: "Tiểu đoàn bộ binh số 1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Tiểu đoàn 2", 
        code: "TD02",
        personnel: 145,
        commander: "Thiếu tá Trần Văn B",
        contact: "0987654322",
        description: "Tiểu đoàn bộ binh số 2",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Tiểu đoàn 3",
        code: "TD03", 
        personnel: 148,
        commander: "Thiếu tá Lê Văn C",
        contact: "0987654323",
        description: "Tiểu đoàn bộ binh số 3",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Lữ đoàn bộ",
        code: "LDB",
        personnel: 80,
        commander: "Trung tá Phạm Văn D", 
        contact: "0987654324",
        description: "Bộ chỉ huy lữ đoàn",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('units').insertMany(units);
    
    // Seed Categories
    console.log('Seeding categories...');
    const categories = [
      {
        _id: new ObjectId(),
        name: "Rau củ quả",
        slug: "rau-cu-qua",
        description: "Các loại rau xanh, củ quả tươi",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Thịt",
        slug: "thit",
        description: "Thịt lợn, bò, gà và các loại thịt khác",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Hải sản",
        slug: "hai-san", 
        description: "Cá, tôm, cua và các loại hải sản",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Chất đốt",
        slug: "chat-dot",
        description: "Gas, than, củi và các chất đốt",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Gia vị",
        slug: "gia-vi",
        description: "Muối, đường, nước mắm, các loại gia vị",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Lương thực",
        slug: "luong-thuc",
        description: "Gạo, bún, phở và các loại lương thực",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('categories').insertMany(categories);
    
    // Get category IDs for products
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });
    
    // Seed Products (LTTP Items)
    console.log('Seeding products...');
    const products = [
      // Rau củ quả
      {
        _id: new ObjectId(),
        name: "Rau cải",
        category: categoryMap["rau-cu-qua"],
        unit: "kg",
        description: "Rau cải xanh tươi",
        nutritionalValue: "Vitamin A, C",
        storageCondition: "Bảo quản lạnh 2-4°C",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Cà rốt",
        category: categoryMap["rau-cu-qua"],
        unit: "kg",
        description: "Cà rốt tươi",
        nutritionalValue: "Beta-carotene, Vitamin A",
        storageCondition: "Bảo quản khô ráo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Bí đỏ",
        category: categoryMap["rau-cu-qua"],
        unit: "kg",
        description: "Bí đỏ tươi",
        nutritionalValue: "Vitamin A, C, chất xơ",
        storageCondition: "Nơi khô ráo, thoáng mát",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Thịt
      {
        _id: new ObjectId(),
        name: "Thịt lợn",
        category: categoryMap["thit"],
        unit: "kg",
        description: "Thịt lợn tươi",
        nutritionalValue: "Protein, sắt",
        storageCondition: "Bảo quản lạnh 0-4°C",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Thịt bò",
        category: categoryMap["thit"],
        unit: "kg",
        description: "Thịt bò tươi",
        nutritionalValue: "Protein, sắt, kẽm",
        storageCondition: "Bảo quản lạnh 0-4°C",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Hải sản
      {
        _id: new ObjectId(),
        name: "Cá biển",
        category: categoryMap["hai-san"],
        unit: "kg",
        description: "Cá biển tươi",
        nutritionalValue: "Protein, Omega-3",
        storageCondition: "Bảo quản lạnh -2°C",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Chất đốt
      {
        _id: new ObjectId(),
        name: "Gas",
        category: categoryMap["chat-dot"],
        unit: "bình",
        description: "Bình gas 12kg",
        nutritionalValue: "N/A",
        storageCondition: "Nơi khô ráo, thoáng mát",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Gia vị
      {
        _id: new ObjectId(),
        name: "Muối",
        category: categoryMap["gia-vi"],
        unit: "kg",
        description: "Muối tinh",
        nutritionalValue: "Natri",
        storageCondition: "Nơi khô ráo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Lương thực
      {
        _id: new ObjectId(),
        name: "Gạo tẻ",
        category: categoryMap["luong-thuc"],
        unit: "kg",
        description: "Gạo tẻ thơm",
        nutritionalValue: "Carbohydrate",
        storageCondition: "Nơi khô ráo, thoáng mát",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('products').insertMany(products);
    
    // Get product IDs for dishes and daily rations
    const productMap = {};
    products.forEach(product => {
      productMap[product.name] = product._id.toString();
    });
    
    // Seed Dishes
    console.log('Seeding dishes...');
    const dishes = [
      {
        _id: new ObjectId(),
        name: "Thịt lợn kho",
        description: "Món thịt lợn kho đậm đà",
        servings: 10,
        preparationTime: 45,
        difficulty: "medium",
        category: "Món mặn",
        ingredients: [
          {
            lttpId: productMap["Thịt lợn"],
            lttpName: "Thịt lợn",
            quantity: 1.5,
            unit: "kg",
            notes: "Thái miếng vừa"
          },
          {
            lttpId: productMap["Muối"],
            lttpName: "Muối",
            quantity: 0.02,
            unit: "kg",
            notes: "Nêm vừa ăn"
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Canh cải thịt bằm",
        description: "Canh rau cải với thịt bằm",
        servings: 10,
        preparationTime: 30,
        difficulty: "easy",
        category: "Canh",
        ingredients: [
          {
            lttpId: productMap["Rau cải"],
            lttpName: "Rau cải",
            quantity: 0.8,
            unit: "kg",
            notes: "Rửa sạch, thái khúc"
          },
          {
            lttpId: productMap["Thịt lợn"],
            lttpName: "Thịt lợn",
            quantity: 0.3,
            unit: "kg",
            notes: "Băm nhỏ"
          },
          {
            lttpId: productMap["Muối"],
            lttpName: "Muối",
            quantity: 0.015,
            unit: "kg",
            notes: "Nêm vừa ăn"
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Giò chả",
        description: "Giò chả truyền thống",
        servings: 20,
        preparationTime: 120,
        difficulty: "hard",
        category: "Món chế biến",
        ingredients: [
          {
            lttpId: productMap["Thịt lợn"],
            lttpName: "Thịt lợn",
            quantity: 2,
            unit: "kg",
            notes: "Thịt nạc vai"
          },
          {
            lttpId: productMap["Muối"],
            lttpName: "Muối",
            quantity: 0.04,
            unit: "kg",
            notes: "Muối tinh"
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('dishes').insertMany(dishes);
    
    // Seed Daily Rations (65,000 VND/person/day)
    console.log('Seeding daily rations...');
    const dailyRations = [
      {
        _id: new ObjectId(),
        name: "Gạo tẻ",
        lttpId: productMap["Gạo tẻ"],
        lttpName: "Gạo tẻ",
        quantityPerPerson: 0.6,
        unit: "kg",
        pricePerUnit: 25000,
        totalCostPerPerson: 15000,
        category: "Lương thực",
        notes: "Khẩu phần chính",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Thịt lợn",
        lttpId: productMap["Thịt lợn"],
        lttpName: "Thịt lợn",
        quantityPerPerson: 0.15,
        unit: "kg",
        pricePerUnit: 180000,
        totalCostPerPerson: 27000,
        category: "Thịt",
        notes: "Protein chính",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Rau cải",
        lttpId: productMap["Rau cải"],
        lttpName: "Rau cải",
        quantityPerPerson: 0.2,
        unit: "kg",
        pricePerUnit: 15000,
        totalCostPerPerson: 3000,
        category: "Rau củ quả",
        notes: "Vitamin và chất xơ",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Cá biển",
        lttpId: productMap["Cá biển"],
        lttpName: "Cá biển",
        quantityPerPerson: 0.1,
        unit: "kg",
        pricePerUnit: 120000,
        totalCostPerPerson: 12000,
        category: "Hải sản",
        notes: "Protein bổ sung",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Gia vị",
        lttpId: productMap["Muối"],
        lttpName: "Muối",
        quantityPerPerson: 0.01,
        unit: "kg",
        pricePerUnit: 8000,
        totalCostPerPerson: 80,
        category: "Gia vị",
        notes: "Gia vị cơ bản",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Chất đốt",
        lttpId: productMap["Gas"],
        lttpName: "Gas",
        quantityPerPerson: 0.002,
        unit: "bình",
        pricePerUnit: 400000,
        totalCostPerPerson: 800,
        category: "Chất đốt",
        notes: "Năng lượng nấu ăn",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('dailyRations').insertMany(dailyRations);
    
    console.log('Data library seeding completed successfully!');
    console.log(`- Units: ${units.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Dishes: ${dishes.length}`);
    console.log(`- Daily Rations: ${dailyRations.length}`);
    
    // Calculate total daily cost
    const totalCost = dailyRations.reduce((sum, ration) => sum + ration.totalCostPerPerson, 0);
    console.log(`- Total daily cost per person: ${totalCost.toLocaleString()} VND`);
    console.log(`- Standard budget: 65,000 VND`);
    console.log(`- Budget status: ${totalCost <= 65000 ? 'Within budget' : 'Over budget'}`);
    
  } catch (error) {
    console.error('Error seeding data library:', error);
  } finally {
    await client.close();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDataLibrary();
}

module.exports = { seedDataLibrary }; 