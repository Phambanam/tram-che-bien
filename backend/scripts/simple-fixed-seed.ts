import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/user.model';
import { Unit } from '../src/models/unit.model';
import { Category } from '../src/models/category.model';
import { Product } from '../src/models/product.model';
import { Supply } from '../src/models/supply.model';
import { LTTPItem } from '../src/models/lttp-item.model';

dotenv.config();

console.log('🌱 Creating Military Logistics Database (Simple Version)...');

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
      { _id: "thuc-pham", name: "Thực phẩm", description: "Thực phẩm cơ bản", status: "active" },
      { _id: "rau-cu-qua", name: "Rau củ quả", description: "Rau củ tươi sống", status: "active" },
      { _id: "gia-vi", name: "Gia vị", description: "Gia vị nấu ăn", status: "active" },
      { _id: "chat-dot", name: "Chất đốt", description: "Nhiên liệu nấu ăn", status: "active" }
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // 4. Create Products  
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      { 
        _id: "gao-te-loai-1",
        name: "Gạo tẻ loại 1",
        category: categories[0]._id,
        unit: "Kg",
        standardAmount: 25,
        description: "Gạo tẻ chất lượng cao",
        status: "active"
      },
      {
        _id: "thit-heo-nac",
        name: "Thịt heo nạc", 
        category: categories[0]._id,
        unit: "Kg",
        standardAmount: 10,
        description: "Thịt heo nạc tươi",
        status: "active"
      },
      {
        _id: "thit-ga-ta",
        name: "Thịt gà ta",
        category: categories[0]._id, 
        unit: "Kg",
        standardAmount: 8,
        description: "Thịt gà ta tươi",
        status: "active"
      },
      {
        _id: "ca-chua",
        name: "Cà chua",
        category: categories[1]._id,
        unit: "Kg",
        standardAmount: 5,
        description: "Cà chua tươi",
        status: "active"
      },
      {
        _id: "rau-cai-ngot",
        name: "Rau cải ngọt",
        category: categories[1]._id,
        unit: "Kg",
        standardAmount: 3,
        description: "Rau cải ngọt tươi", 
        status: "active"
      },
      {
        _id: "bap-cai",
        name: "Bắp cải",
        category: categories[1]._id,
        unit: "Kg",
        standardAmount: 4,
        description: "Bắp cải tươi",
        status: "active"
      },
      {
        _id: "muoi-tinh",
        name: "Muối tinh",
        category: categories[2]._id,
        unit: "Kg",
        standardAmount: 1,
        description: "Muối tinh khiết",
        status: "active"
      },
      {
        _id: "dau-an",
        name: "Dầu ăn",
        category: categories[2]._id,
        unit: "Lít",
        standardAmount: 2,
        description: "Dầu ăn thực vật",
        status: "active"
      },
      {
        _id: "dau-nanh-kho",
        name: "Đậu nành khô",
        category: categories[0]._id,
        unit: "Kg",
        standardAmount: 5,
        description: "Đậu nành khô làm đậu phụ",
        status: "active"
      },
      {
        _id: "gas-lpg",
        name: "Gas LPG",
        category: categories[3]._id,
        unit: "Kg",
        standardAmount: 12,
        description: "Gas nấu ăn",
        status: "active"
      }
    ]);

    console.log(`✅ Created ${products.length} products`);

    // 5. Create some sample supplies
    console.log('📋 Creating supplies...');
    const supplies = await Supply.insertMany([
      {
        unit: units[0]._id,
        category: categories[0]._id,
        product: products[0]._id,
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
        category: categories[1]._id,
        product: products[5]._id,
        supplyQuantity: 50,
        requestedQuantity: 50,
        status: "pending",
        createdBy: {
          id: users[2]._id,
          name: users[2].fullName
        },
        note: "Cần duyệt nhanh"
      },
      {
        unit: units[2]._id,
        category: categories[0]._id,
        product: products[1]._id,
        supplyQuantity: 25,
        requestedQuantity: 30,
        receivedQuantity: 25,
        actualQuantity: 25,
        unitPrice: 180000,
        totalPrice: 4500000,
        status: "received",
        createdBy: {
          id: users[2]._id,
          name: users[2].fullName
        },
        approvedBy: {
          id: users[0]._id,
          name: users[0].fullName
        },
        note: "Thịt heo chất lượng tốt"
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
      },
      {
        name: "Thịt heo nạc",
        category: "Thực phẩm",
        unit: "Kg",
        unitPrice: 180000,
        description: "Thịt heo nạc tươi",
        createdBy: users[0]._id,
        isActive: true
      },
      {
        name: "Thịt gà ta",
        category: "Thực phẩm",
        unit: "Kg",
        unitPrice: 120000,
        description: "Thịt gà ta tươi",
        createdBy: users[0]._id,
        isActive: true
      }
    ]);

    console.log(`✅ Created ${lttpItems.length} LTTP items`);

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📂 Categories: ${categories.length}`)
    console.log(`📦 Products: ${products.length}`)
    console.log(`📋 Supplies: ${supplies.length}`)  
    console.log(`🏪 LTTP Items: ${lttpItems.length}`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('📧 Admin: admin / admin123')
    console.log('📧 Manager: manager / admin123')
    console.log('📧 Commander: commander1 / admin123')
    
    console.log('\n✨ Core database is ready!')
    console.log('\n📝 Note: Processing station data can be added later when needed')

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