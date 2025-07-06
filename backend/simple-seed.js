const mongoose = require('mongoose')
require('dotenv').config()

console.log('🌱 Creating Military Logistics Database...')

async function connect() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics'
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB')
    return true
  } catch (error) {
    console.error('❌ Connection error:', error)
    return false
  }
}

// Simple schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  rank: String,
  position: String,
  contact: String
}, { timestamps: true })

const UnitSchema = new mongoose.Schema({
  name: String,
  code: String,
  personnel: Number,
  commander: String,
  contact: String
}, { timestamps: true })

const LTTPItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  unit: String,
  unitPrice: Number,
  description: String,
  createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true })

const ProcessingSchema = new mongoose.Schema({}, { strict: false })

// Models
const User = mongoose.model('User', UserSchema)
const Unit = mongoose.model('Unit', UnitSchema)  
const LTTPItem = mongoose.model('LTTPItem', LTTPItemSchema)
const TofuProcessing = mongoose.model('TofuProcessing', ProcessingSchema)
const SaltProcessing = mongoose.model('SaltProcessing', ProcessingSchema)

async function seedData() {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Unit.deleteMany({})
    await LTTPItem.deleteMany({})
    await TofuProcessing.deleteMany({})
    await SaltProcessing.deleteMany({})
    
    console.log('🗑️  Cleared existing data')
    
    // Create users
    const users = await User.insertMany([
      {
        name: "Admin User",
        email: "admin@military.gov.vn",
        password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // admin123
        role: "admin",
        rank: "Thiếu tá",
        position: "Trưởng phòng",
        contact: "0901111111"
      },
      {
        name: "Manager User", 
        email: "manager@military.gov.vn",
        password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // admin123
        role: "stationManager",
        rank: "Đại úy",
        position: "Quản lý trạm",
        contact: "0902222222"
      }
    ])
    
    console.log(`👥 Created ${users.length} users`)
    
    // Create units
    const units = await Unit.insertMany([
      { name: "Tiểu đoàn 1", code: "TD1", personnel: 150, commander: "Đại úy A", contact: "0901234567" },
      { name: "Tiểu đoàn 2", code: "TD2", personnel: 135, commander: "Đại úy B", contact: "0901234568" },
      { name: "Tiểu đoàn 3", code: "TD3", personnel: 140, commander: "Đại úy C", contact: "0901234569" },
      { name: "Lữ đoàn bộ", code: "LDH", personnel: 45, commander: "Thiếu úy D", contact: "0901234570" }
    ])
    
    console.log(`🏢 Created ${units.length} units`)
    
    // Create LTTP items
    const lttpItems = await LTTPItem.insertMany([
      { name: "Gạo tẻ loại 1", category: "Thực phẩm", unit: "Kg", unitPrice: 22000, description: "Gạo tẻ chất lượng cao", createdBy: users[0]._id },
      { name: "Thịt heo nạc", category: "Thực phẩm", unit: "Kg", unitPrice: 180000, description: "Thịt heo nạc tươi", createdBy: users[0]._id },
      { name: "Thịt gà ta", category: "Thực phẩm", unit: "Kg", unitPrice: 120000, description: "Thịt gà ta tươi", createdBy: users[0]._id },
      { name: "Cá tra fillet", category: "Thực phẩm", unit: "Kg", unitPrice: 85000, description: "Cá tra fillet tươi", createdBy: users[0]._id },
      { name: "Trứng gà tươi", category: "Thực phẩm", unit: "Kg", unitPrice: 35000, description: "Trứng gà tươi", createdBy: users[0]._id },
      { name: "Cà chua", category: "Rau củ quả", unit: "Kg", unitPrice: 25000, description: "Cà chua tươi", createdBy: users[0]._id },
      { name: "Rau cải ngọt", category: "Rau củ quả", unit: "Kg", unitPrice: 18000, description: "Rau cải ngọt tươi", createdBy: users[0]._id },
      { name: "Bắp cải", category: "Rau củ quả", unit: "Kg", unitPrice: 12000, description: "Bắp cải tươi", createdBy: users[0]._id },
      { name: "Muối tinh", category: "Gia vị", unit: "Kg", unitPrice: 8000, description: "Muối tinh khiết", createdBy: users[0]._id },
      { name: "Đường cát trắng", category: "Gia vị", unit: "Kg", unitPrice: 22000, description: "Đường cát trắng", createdBy: users[0]._id },
      { name: "Nước mắm", category: "Gia vị", unit: "Lít", unitPrice: 35000, description: "Nước mắm truyền thống", createdBy: users[0]._id },
      { name: "Dầu ăn", category: "Gia vị", unit: "Lít", unitPrice: 48000, description: "Dầu ăn thực vật", createdBy: users[0]._id },
      { name: "Đậu nành khô", category: "Thực phẩm", unit: "Kg", unitPrice: 28000, description: "Đậu nành khô làm đậu phụ", createdBy: users[0]._id },
      { name: "Gas LPG", category: "Chất đốt", unit: "Kg", unitPrice: 28000, description: "Gas nấu ăn", createdBy: users[0]._id }
    ])
    
    console.log(`📦 Created ${lttpItems.length} LTTP items`)
    
    // Create processing data for last 30 days
    const today = new Date()
    const tofuData = []
    const saltData = []
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Tofu processing
      const soybeansInput = 30 + Math.floor(Math.random() * 40)
      const tofuOutput = Math.floor(soybeansInput * 0.3)
      
      tofuData.push({
        date,
        input: {
          soybeans: {
            quantity: soybeansInput,
            quality: 'Tốt',
            price: 28000,
            carryOverFromPreviousDay: i === 29 ? 0 : Math.floor(Math.random() * 10)
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
        notes: `Sản xuất đậu phụ ngày ${date.toLocaleDateString('vi-VN')}`
      })
      
      // Salt processing  
      const cabbageInput = 20 + Math.floor(Math.random() * 30)
      const pickledOutput = Math.floor(cabbageInput * 0.7)
      
      saltData.push({
        date,
        input: {
          cabbage: {
            quantity: cabbageInput,
            quality: 'Tốt',
            price: 12000,
            carryOverFromPreviousDay: i === 29 ? 0 : Math.floor(Math.random() * 8)
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
        notes: `Ướp muối rau cải ngày ${date.toLocaleDateString('vi-VN')}`
      })
    }
    
    await TofuProcessing.insertMany(tofuData)
    await SaltProcessing.insertMany(saltData)
    
    console.log(`🥛 Created ${tofuData.length} tofu processing records`)
    console.log(`🧂 Created ${saltData.length} salt processing records`)
    
    console.log('\n🎉 Database seeding completed!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📦 LTTP Items: ${lttpItems.length}`)
    console.log(`🏭 Processing Records: ${tofuData.length + saltData.length}`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('📧 Admin: admin@military.gov.vn / admin123')
    console.log('📧 Manager: manager@military.gov.vn / admin123')
    
    console.log('\n✨ Your database is ready!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
}

async function main() {
  const connected = await connect()
  if (!connected) {
    process.exit(1)
  }
  
  await seedData()
  
  await mongoose.connection.close()
  console.log('📴 Database connection closed')
}

main() 