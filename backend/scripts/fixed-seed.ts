import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/user.model';
import { Unit } from '../src/models/unit.model';
import { Category } from '../src/models/category.model';
import { Product } from '../src/models/product.model';
import { Supply } from '../src/models/supply.model';
import { LTTPItem } from '../src/models/lttp-item.model';
import { 
  TofuProcessing,
  SaltProcessing,
  BeanSproutsProcessing 
} from '../src/models/processing-station.model';

dotenv.config();

console.log('🌱 Creating Military Logistics Database with correct schema...');

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing existing data and fixing indexes...');
    
    // Clear collections
    await User.deleteMany({});
    await Unit.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Supply.deleteMany({});
    await LTTPItem.deleteMany({});
    await TofuProcessing.deleteMany({});
    await SaltProcessing.deleteMany({});
    await BeanSproutsProcessing.deleteMany({});
    
    // Drop old indexes that might conflict
    try {
      const userIndexes = await User.collection.indexes();
      console.log('📋 Current user indexes:', userIndexes.map(idx => idx.name));
      
      // Drop email index if it exists
      const emailIndexExists = userIndexes.some(idx => idx.name === 'email_1');
      if (emailIndexExists) {
        await User.collection.dropIndex('email_1');
        console.log('🗑️  Dropped old email index');
      }
    } catch (error) {
      console.log('ℹ️  No conflicting indexes to drop');
    }
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedData() {
  try {
    // 1. Create Units first (required for users)
    console.log('🏢 Creating units...');
    const units = await Unit.insertMany([
      {
        name: "Tiểu đoàn 1",
        code: "TD1",
        personnel: 150,
        commander: "Đại úy Nguyễn Văn A",
        contact: "0901234567",
        description: "Đơn vị chủ lực số 1",
        isActive: true
      },
      {
        name: "Tiểu đoàn 2", 
        code: "TD2",
        personnel: 135,
        commander: "Đại úy Trần Văn B",
        contact: "0901234568",
        description: "Đơn vị chủ lực số 2",
        isActive: true
      },
      {
        name: "Tiểu đoàn 3",
        code: "TD3", 
        personnel: 140,
        commander: "Đại úy Lê Văn C",
        contact: "0901234569",
        description: "Đơn vị chủ lực số 3",
        isActive: true
      },
      {
        name: "Lữ đoàn bộ",
        code: "LDB",
        personnel: 45,
        commander: "Thiếu úy Phạm Văn D",
        contact: "0901234570",
        description: "Đơn vị hỗ trợ và lễ tân",
        isActive: true
      }
    ]);

    console.log(`✅ Created ${units.length} units`);

    // 2. Create Users one by one to handle any remaining conflicts
    console.log('👥 Creating users...');
    const users = [];
    
    const usersData = [
      {
        username: "admin",
        phoneNumber: "0901111111",
        password: "admin123", // Will be hashed by pre-save hook
        fullName: "Thiếu tá Nguyễn Văn Admin",
        role: "admin" as const,
        unit: units[0]._id,
        rank: "Thiếu tá",
        position: "Trưởng phòng Quản lý",
        status: "active" as const
      },
      {
        username: "manager",
        phoneNumber: "0902222222", 
        password: "admin123",
        fullName: "Đại úy Trần Thị Manager",
        role: "stationManager" as const,
        unit: units[0]._id,
        rank: "Đại úy",
        position: "Quản lý Trạm chế biến",
        status: "active" as const
      },
      {
        username: "commander1",
        phoneNumber: "0903333333",
        password: "admin123",
        fullName: "Đại úy Nguyễn Văn A",
        role: "commander" as const,
        unit: units[0]._id,
        rank: "Đại úy", 
        position: "Chỉ huy tiểu đoàn",
        status: "active" as const
      }
    ];

    for (const userData of usersData) {
      try {
        const user = new User(userData);
        await user.save();
        users.push(user);
        console.log(`✅ Created user: ${userData.username}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error);
        throw error;
      }
    }

    // 3. Create Categories
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany([
      { name: "Thực phẩm", description: "Thực phẩm cơ bản", isActive: true },
      { name: "Rau củ quả", description: "Rau củ tươi sống", isActive: true },
      { name: "Gia vị", description: "Gia vị nấu ăn", isActive: true },
      { name: "Chất đốt", description: "Nhiên liệu nấu ăn", isActive: true }
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // 4. Create Products  
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      { 
        name: "Gạo tẻ loại 1",
        category: categories[0].name,
        unit: "Kg",
        description: "Gạo tẻ chất lượng cao",
        isActive: true
      },
      {
        name: "Thịt heo nạc", 
        category: categories[0].name,
        unit: "Kg",
        description: "Thịt heo nạc tươi",
        isActive: true
      },
      {
        name: "Thịt gà ta",
        category: categories[0].name, 
        unit: "Kg",
        description: "Thịt gà ta tươi",
        isActive: true
      },
      {
        name: "Cà chua",
        category: categories[1].name,
        unit: "Kg", 
        description: "Cà chua tươi",
        isActive: true
      },
      {
        name: "Rau cải ngọt",
        category: categories[1].name,
        unit: "Kg",
        description: "Rau cải ngọt tươi", 
        isActive: true
      },
      {
        name: "Bắp cải",
        category: categories[1].name,
        unit: "Kg",
        description: "Bắp cải tươi",
        isActive: true
      },
      {
        name: "Muối tinh",
        category: categories[2].name,
        unit: "Kg",
        description: "Muối tinh khiết",
        isActive: true
      },
      {
        name: "Dầu ăn",
        category: categories[2].name,
        unit: "Lít", 
        description: "Dầu ăn thực vật",
        isActive: true
      },
      {
        name: "Đậu nành khô",
        category: categories[0].name,
        unit: "Kg",
        description: "Đậu nành khô làm đậu phụ",
        isActive: true
      },
      {
        name: "Gas LPG",
        category: categories[3].name,
        unit: "Kg",
        description: "Gas nấu ăn",
        isActive: true
      }
    ]);

    console.log(`✅ Created ${products.length} products`);

    // 5. Create some sample supplies
    console.log('📋 Creating supplies...');
    const supplies = await Supply.insertMany([
      {
        unit: units[0]._id,
        category: categories[0].name,
        product: products[0].name,
        supplyQuantity: 100,
        requestedQuantity: 100,
        receivedQuantity: 95,
        actualQuantity: 95,
        unitPrice: 22000,
        totalPrice: 2090000,
        status: "received",
        createdBy: {
          id: users[2]._id,
          name: users[2].fullName
        },
        approvedBy: {
          id: users[0]._id,
          name: users[0].fullName
        },
        note: "Gạo chất lượng tốt"
      },
      {
        unit: units[1]._id,
        category: categories[1].name,
        product: products[5].name,
        supplyQuantity: 50,
        requestedQuantity: 50,
        status: "pending",
        createdBy: {
          id: users[2]._id,
          name: users[2].fullName
        },
        note: "Cần duyệt nhanh"
      }
    ]);

    console.log(`✅ Created ${supplies.length} supplies`);

    // 6. Create LTTP Items
    console.log('🏪 Creating LTTP items...');
    const lttpItems = await LTTPItem.insertMany([
      {
        name: "Gạo tẻ loại 1",
        category: "Thực phẩm",
        unit: "Kg",
        unitPrice: 22000,
        description: "Gạo tẻ chất lượng cao",
        createdBy: users[0]._id,
        isActive: true
      },
      {
        name: "Đậu nành khô", 
        category: "Thực phẩm",
        unit: "Kg",
        unitPrice: 28000,
        description: "Đậu nành khô làm đậu phụ",
        createdBy: users[0]._id,
        isActive: true
      },
      {
        name: "Bắp cải",
        category: "Rau củ quả",
        unit: "Kg", 
        unitPrice: 12000,
        description: "Bắp cải tươi để ướp muối",
        createdBy: users[0]._id,
        isActive: true
      }
    ]);

    console.log(`✅ Created ${lttpItems.length} LTTP items`);

    // 7. Create Processing Station Data (smaller batch for testing)
    console.log('🏭 Creating processing station data...');
    const today = new Date();
    const tofuData = [];
    const saltData = [];

    // Only create 10 days of data for initial testing
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Tofu processing
      const soybeansInput = 30 + Math.floor(Math.random() * 40);
      const tofuOutput = Math.floor(soybeansInput * 0.3);
      
      tofuData.push({
        date,
        stationType: 'tofu',
        input: {
          soybeans: {
            quantity: soybeansInput,
            quality: 'Tốt',
            price: 28000,
            carryOverFromPreviousDay: i === 9 ? 0 : Math.floor(Math.random() * 10)
          }
        },
        output: {
          tofu: {
            quantity: tofuOutput,
            quality: 'Tốt',
            pricePerKg: 35000
          }
        },
        remaining: {
          soybeans: Math.floor(Math.random() * 15),
          tofu: Math.floor(Math.random() * 8)
        },
        financial: {
          totalInputCost: soybeansInput * 28000,
          totalOutputValue: tofuOutput * 35000,
          profit: (tofuOutput * 35000) - (soybeansInput * 28000),
          profitMargin: ((tofuOutput * 35000) - (soybeansInput * 28000)) / (soybeansInput * 28000) * 100
        },
        processedBy: users[1]._id,
        notes: `Sản xuất đậu phụ ngày ${date.toLocaleDateString('vi-VN')}`
      });

      // Salt processing
      const cabbageInput = 20 + Math.floor(Math.random() * 30);
      const pickledOutput = Math.floor(cabbageInput * 0.7);
      
      saltData.push({
        date,
        stationType: 'salt',
        input: {
          cabbage: {
            quantity: cabbageInput,
            quality: 'Tốt', 
            price: 12000,
            carryOverFromPreviousDay: i === 9 ? 0 : Math.floor(Math.random() * 8)
          }
        },
        output: {
          pickledCabbage: {
            quantity: pickledOutput,
            quality: 'Tốt',
            pricePerKg: 15000
          }
        },
        remaining: {
          cabbage: Math.floor(Math.random() * 10),
          pickledCabbage: Math.floor(Math.random() * 6)
        },
        financial: {
          totalInputCost: cabbageInput * 12000,
          totalOutputValue: pickledOutput * 15000,
          profit: (pickledOutput * 15000) - (cabbageInput * 12000),
          profitMargin: ((pickledOutput * 15000) - (cabbageInput * 12000)) / (cabbageInput * 12000) * 100
        },
        processedBy: users[1]._id,
        notes: `Ướp muối rau cải ngày ${date.toLocaleDateString('vi-VN')}`
      });
    }

    await TofuProcessing.insertMany(tofuData);
    await SaltProcessing.insertMany(saltData);

    console.log(`✅ Created ${tofuData.length} tofu processing records`);
    console.log(`✅ Created ${saltData.length} salt processing records`);

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📂 Categories: ${categories.length}`)
    console.log(`📦 Products: ${products.length}`)
    console.log(`📋 Supplies: ${supplies.length}`)  
    console.log(`🏪 LTTP Items: ${lttpItems.length}`)
    console.log(`🥛 Tofu Processing: ${tofuData.length}`)
    console.log(`🧂 Salt Processing: ${saltData.length}`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('📧 Admin: admin / admin123')
    console.log('📧 Manager: manager / admin123')
    console.log('📧 Commander: commander1 / admin123')
    
    console.log('\n✨ Database is ready with correct schema!')

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

async function main() {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  await clearDatabase();
  await seedData();
  
  await mongoose.connection.close();
  console.log('📴 Database connection closed');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 