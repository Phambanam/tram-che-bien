#!/usr/bin/env node

const mongoose = require('mongoose')
require('dotenv').config()

console.log('🚀 Military Logistics Database Creator')
console.log('=====================================')

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics'
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB:', uri)
    return true
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    return false
  }
}

async function createComprehensiveDatabase() {
  console.log('🌱 Starting comprehensive database creation...')
  
  const connected = await connectDB()
  if (!connected) {
    console.error('❌ Could not connect to database')
    process.exit(1)
  }
  
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing collections...')
    const collections = ['users', 'units', 'lttpitems', 'lttpinventories', 'lttpdistributions',
                        'tofuprocessings', 'saltprocessings', 'beansproutsprocessings',
                        'sausageprocessings', 'livestockprocessings', 'poultryprocessings']
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).drop()
        console.log(`   ✓ Dropped ${collection}`)
      } catch (error) {
        // Collection might not exist
      }
    }
    
    // Define schemas
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, enum: ['admin', 'stationManager', 'user'], default: 'user' },
      rank: String,
      position: String,
      contact: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true })
    
    const unitSchema = new mongoose.Schema({
      name: String,
      code: { type: String, unique: true },
      personnel: Number,
      commander: String,
      contact: String,
      description: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true })
    
    const lttpItemSchema = new mongoose.Schema({
      name: String,
      category: String,
      unit: String,
      unitPrice: Number,
      description: String,
      nutritionalInfo: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 }
      },
      storageRequirements: {
        temperature: String,
        humidity: String,
        shelfLife: Number
      },
      supplier: {
        name: String,
        contact: String,
        address: String
      },
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }, { timestamps: true })
    
    // Create models
    const User = mongoose.model('User', userSchema)
    const Unit = mongoose.model('Unit', unitSchema)
    const LTTPItem = mongoose.model('LTTPItem', lttpItemSchema)
    
    // Create comprehensive data
    console.log('👥 Creating users...')
    const users = await User.insertMany([
      {
        name: "Thiếu tá Nguyễn Văn Admin",
        email: "admin@military.gov.vn",
        password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK",
        role: "admin",
        rank: "Thiếu tá",
        position: "Trưởng phòng Quản lý Tài khoản",
        contact: "0901111111"
      },
      {
        name: "Đại úy Trần Thị Manager",
        email: "manager@military.gov.vn",
        password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK",
        role: "stationManager",
        rank: "Đại úy",
        position: "Quản lý Trạm chế biến",
        contact: "0902222222"
      },
      {
        name: "Trung úy Lê Văn User",
        email: "user@military.gov.vn",
        password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK",
        role: "user",
        rank: "Trung úy",
        position: "Cán bộ Quản lý Kho",
        contact: "0903333333"
      }
    ])
    
    console.log('🏢 Creating units...')
    const units = await Unit.insertMany([
      {
        name: "Tiểu đoàn 1",
        code: "TD1",
        personnel: 150,
        commander: "Đại úy Nguyễn Văn A",
        contact: "0901234567",
        description: "Đơn vị chủ lực số 1"
      },
      {
        name: "Tiểu đoàn 2",
        code: "TD2",
        personnel: 135,
        commander: "Đại úy Trần Văn B",
        contact: "0901234568",
        description: "Đơn vị chủ lực số 2"
      },
      {
        name: "Tiểu đoàn 3",
        code: "TD3",
        personnel: 140,
        commander: "Đại úy Lê Văn C",
        contact: "0901234569",
        description: "Đơn vị chủ lực số 3"
      },
      {
        name: "Lữ đoàn bộ",
        code: "LDH",
        personnel: 45,
        commander: "Thiếu úy Phạm Văn D",
        contact: "0901234570",
        description: "Đơn vị hỗ trợ và lễ tân"
      }
    ])
    
    console.log('📦 Creating LTTP items...')
    const lttpItemsData = [
      // Basic foods
      { name: "Gạo tẻ loại 1", category: "Thực phẩm", unit: "Kg", unitPrice: 22000, 
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 },
        supplier: { name: "Công ty TNHH Lương thực Miền Nam", contact: "0909123456" }
      },
      { name: "Thịt heo nạc", category: "Thực phẩm", unit: "Kg", unitPrice: 180000,
        storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 }
      },
      { name: "Thịt gà ta", category: "Thực phẩm", unit: "Kg", unitPrice: 120000,
        storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 }
      },
      { name: "Cá tra fillet", category: "Thực phẩm", unit: "Kg", unitPrice: 85000,
        storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 2 }
      },
      { name: "Trứng gà tươi", category: "Thực phẩm", unit: "Kg", unitPrice: 35000,
        storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
      },
      
      // Vegetables
      { name: "Cà chua", category: "Rau củ quả", unit: "Kg", unitPrice: 25000,
        storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 7 }
      },
      { name: "Rau cải ngọt", category: "Rau củ quả", unit: "Kg", unitPrice: 18000,
        storageRequirements: { temperature: "Mát", humidity: "Ẩm", shelfLife: 3 }
      },
      { name: "Bắp cải", category: "Rau củ quả", unit: "Kg", unitPrice: 12000,
        storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
      },
      { name: "Củ cải trắng", category: "Rau củ quả", unit: "Kg", unitPrice: 15000,
        storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
      },
      { name: "Hành lá", category: "Rau củ quả", unit: "Kg", unitPrice: 45000,
        storageRequirements: { temperature: "Mát", humidity: "Ẩm", shelfLife: 5 }
      },
      { name: "Khoai tây", category: "Rau củ quả", unit: "Kg", unitPrice: 20000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 30 }
      },
      
      // Seasonings
      { name: "Muối tinh", category: "Gia vị", unit: "Kg", unitPrice: 8000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
      },
      { name: "Đường cát trắng", category: "Gia vị", unit: "Kg", unitPrice: 22000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 730 }
      },
      { name: "Nước mắm", category: "Gia vị", unit: "Lít", unitPrice: 35000,
        storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 1095 }
      },
      { name: "Dầu ăn", category: "Gia vị", unit: "Lít", unitPrice: 48000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 540 }
      },
      { name: "Tỏi tươi", category: "Gia vị", unit: "Kg", unitPrice: 55000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 60 }
      },
      
      // Processing ingredients
      { name: "Đậu nành khô", category: "Thực phẩm", unit: "Kg", unitPrice: 28000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 }
      },
      { name: "Thạch cao thực phẩm", category: "Gia vị", unit: "Kg", unitPrice: 45000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
      },
      
      // Fuel
      { name: "Gas LPG", category: "Chất đốt", unit: "Kg", unitPrice: 28000,
        storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
      }
    ]
    
    const lttpItems = await LTTPItem.insertMany(
      lttpItemsData.map(item => ({ ...item, createdBy: users[0]._id }))
    )
    
    console.log('🏭 Creating processing station data...')
    const ProcessingSchema = new mongoose.Schema({}, { strict: false })
    
    const TofuProcessing = mongoose.model('TofuProcessing', ProcessingSchema)
    const SaltProcessing = mongoose.model('SaltProcessing', ProcessingSchema)
    const BeanSproutsProcessing = mongoose.model('BeanSproutsProcessing', ProcessingSchema)
    const SausageProcessing = mongoose.model('SausageProcessing', ProcessingSchema)
    const LivestockProcessing = mongoose.model('LivestockProcessing', ProcessingSchema)
    const PoultryProcessing = mongoose.model('PoultryProcessing', ProcessingSchema)
    
    // Generate 60 days of processing data
    const today = new Date()
    const processingData = {
      tofu: [],
      salt: [],
      beanSprouts: [],
      sausage: [],
      livestock: [],
      poultry: []
    }
    
    for (let i = 59; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Tofu processing
      const soybeansInput = 30 + Math.floor(Math.random() * 40)
      const tofuOutput = Math.floor(soybeansInput * (0.25 + Math.random() * 0.1))
      
      processingData.tofu.push({
        date,
        input: {
          soybeans: {
            quantity: soybeansInput,
            quality: 'Tốt',
            price: 28000,
            carryOverFromPreviousDay: i === 59 ? 0 : Math.floor(Math.random() * 10)
          },
          water: soybeansInput * 8,
          coagulant: soybeansInput * 20
        },
        output: {
          tofu: {
            quantity: tofuOutput,
            quality: 'Tốt',
            pricePerKg: 35000
          },
          whey: soybeansInput * 6,
          waste: Math.floor(soybeansInput * 0.1)
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
        processing: {
          duration: 180 + Math.floor(Math.random() * 120),
          temperature: 80 + Math.floor(Math.random() * 15),
          yield: (tofuOutput / soybeansInput) * 100,
          qualityNotes: "Đậu phụ chất lượng tốt"
        },
        processedBy: users[1]._id,
        supervisedBy: users[0]._id,
        notes: `Sản xuất đậu phụ ngày ${date.toLocaleDateString('vi-VN')}`
      })
      
      // Salt processing
      const cabbageInput = 20 + Math.floor(Math.random() * 30)
      const pickledOutput = Math.floor(cabbageInput * (0.65 + Math.random() * 0.15))
      
      processingData.salt.push({
        date,
        input: {
          cabbage: {
            quantity: cabbageInput,
            quality: 'Tốt',
            price: 12000,
            carryOverFromPreviousDay: i === 59 ? 0 : Math.floor(Math.random() * 8)
          },
          salt: Math.floor(cabbageInput * 0.03),
          spices: [
            { name: "Tỏi", quantity: 0.5, unit: "Kg" },
            { name: "Ớt", quantity: 0.3, unit: "Kg" }
          ]
        },
        output: {
          pickledCabbage: {
            quantity: pickledOutput,
            quality: 'Tốt',
            pricePerKg: 15000
          },
          brine: Math.floor(cabbageInput * 0.2),
          waste: Math.floor(cabbageInput * 0.05)
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
        processing: {
          saltingTime: 24,
          fermentationTime: 48 + Math.floor(Math.random() * 48),
          yield: (pickledOutput / cabbageInput) * 100,
          qualityNotes: "Rau cải muối đạt tiêu chuẩn"
        },
        processedBy: users[1]._id,
        supervisedBy: users[0]._id,
        notes: `Ướp muối rau cải ngày ${date.toLocaleDateString('vi-VN')}`
      })
    }
    
    // Insert processing data
    await TofuProcessing.insertMany(processingData.tofu)
    await SaltProcessing.insertMany(processingData.salt)
    
    console.log('✅ Database creation completed!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📦 LTTP Items: ${lttpItems.length}`)
    console.log(`🥛 Tofu Processing Records: ${processingData.tofu.length}`)
    console.log(`🧂 Salt Processing Records: ${processingData.salt.length}`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('📧 Admin: admin@military.gov.vn / admin123')
    console.log('📧 Manager: manager@military.gov.vn / admin123')
    console.log('📧 User: user@military.gov.vn / admin123')
    
    console.log('\n🎉 Your military logistics database is ready!')
    
  } catch (error) {
    console.error('❌ Error creating database:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('📴 Database connection closed')
  }
}

// Run the creation
createComprehensiveDatabase() 