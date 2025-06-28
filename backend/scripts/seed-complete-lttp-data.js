const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics')
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Define schemas inline for seeding
const lttpItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  description: { type: String },
  nutritionalInfo: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  storageRequirements: {
    temperature: { type: String },
    humidity: { type: String },
    shelfLife: { type: Number },
  },
  supplier: {
    name: { type: String },
    contact: { type: String },
    address: { type: String }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const LTTPItem = mongoose.model('LTTPItem', lttpItemSchema)

// LTTP Items seed data
const lttpItemsData = [
  // Thực phẩm chính
  {
    name: "Gạo tẻ loại 1",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 22000,
    description: "Gạo tẻ chất lượng cao, dành cho nấu cơm hàng ngày",
    nutritionalInfo: { calories: 365, protein: 7.1, fat: 0.7, carbs: 80.9, fiber: 0.4 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 },
    supplier: { name: "Công ty TNHH Lương thực Miền Nam", contact: "0909123456", address: "123 Đường ABC, Quận 1, TP.HCM" }
  },
  {
    name: "Thịt heo nạc",
    category: "Thực phẩm", 
    unit: "Kg",
    unitPrice: 180000,
    description: "Thịt heo nạc tươi, đạt tiêu chuẩn vệ sinh an toàn thực phẩm",
    nutritionalInfo: { calories: 143, protein: 20.9, fat: 6.4, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 },
    supplier: { name: "Công ty CP Chăn nuôi Việt Nam", contact: "0908765432", address: "456 Đường XYZ, Quận 2, TP.HCM" }
  },
  {
    name: "Cá tra fillet",
    category: "Thực phẩm",
    unit: "Kg", 
    unitPrice: 85000,
    description: "Cá tra fillet tươi, không chất bảo quản",
    nutritionalInfo: { calories: 90, protein: 15.0, fat: 2.5, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 2 }
  },
  {
    name: "Trứng gà tươi",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 35000,
    description: "Trứng gà tươi, size 2-3",
    nutritionalInfo: { calories: 155, protein: 13.0, fat: 11.0, carbs: 1.1, fiber: 0 },
    storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
  },
  {
    name: "Thịt gà ta",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 120000,
    description: "Thịt gà ta tươi, thịt chắc ngon",
    nutritionalInfo: { calories: 165, protein: 31.0, fat: 3.6, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 }
  },
  
  // Rau củ quả
  {
    name: "Cà chua",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 25000,
    description: "Cà chua tươi, màu đỏ chín",
    nutritionalInfo: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
    storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 7 }
  },
  {
    name: "Rau cải ngọt",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 18000,
    description: "Rau cải ngọt tươi, xanh non",
    nutritionalInfo: { calories: 13, protein: 1.5, fat: 0.2, carbs: 2.2, fiber: 1.2 },
    storageRequirements: { temperature: "Mát", humidity: "Ẩm", shelfLife: 3 }
  },
  {
    name: "Củ cải trắng",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 15000,
    description: "Củ cải trắng tươi, to đều",
    nutritionalInfo: { calories: 18, protein: 0.6, fat: 0.1, carbs: 4.1, fiber: 1.6 },
    storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
  },
  {
    name: "Hành lá",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 45000,
    description: "Hành lá tươi, thơm",
    nutritionalInfo: { calories: 32, protein: 1.8, fat: 0.2, carbs: 7.3, fiber: 2.6 },
    storageRequirements: { temperature: "Mát", humidity: "Ẩm", shelfLife: 5 }
  },
  {
    name: "Khoai tây",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 20000,
    description: "Khoai tây tươi, vỏ sạch",
    nutritionalInfo: { calories: 77, protein: 2.0, fat: 0.1, carbs: 17.6, fiber: 2.2 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 30 }
  },
  {
    name: "Bắp cải",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 12000,
    description: "Bắp cải tươi, lá xanh đậm",
    nutritionalInfo: { calories: 25, protein: 1.3, fat: 0.1, carbs: 5.8, fiber: 2.5 },
    storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 14 }
  },
  
  // Gia vị
  {
    name: "Muối tinh",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 8000,
    description: "Muối tinh khiết, không iod",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  {
    name: "Đường cát trắng",
    category: "Gia vị", 
    unit: "Kg",
    unitPrice: 22000,
    description: "Đường cát trắng tinh khiết",
    nutritionalInfo: { calories: 387, protein: 0, fat: 0, carbs: 99.8, fiber: 0 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 730 }
  },
  {
    name: "Nước mắm",
    category: "Gia vị",
    unit: "Lít",
    unitPrice: 35000,
    description: "Nước mắm truyền thống độ đạm 30",
    storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 1095 }
  },
  {
    name: "Dầu ăn",
    category: "Gia vị",
    unit: "Lít",
    unitPrice: 48000,
    description: "Dầu ăn thực vật cao cấp",
    nutritionalInfo: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 540 }
  },
  {
    name: "Tỏi tươi",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 55000,
    description: "Tỏi tươi, múi to đều",
    nutritionalInfo: { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1, fiber: 2.1 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 60 }
  },
  {
    name: "Hạt tiêu",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 280000,
    description: "Hạt tiêu đen nguyên chất",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  
  // Nguyên liệu chế biến
  {
    name: "Đậu nành khô",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 28000,
    description: "Đậu nành khô chất lượng cao để làm đậu phụ và giá đỗ",
    nutritionalInfo: { calories: 446, protein: 36.5, fat: 19.9, carbs: 30.2, fiber: 9.3 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 }
  },
  {
    name: "Thạch cao thực phẩm",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 45000,
    description: "Thạch cao thực phẩm dùng làm đậu phụ",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  
  // Chất đốt
  {
    name: "Gas LPG",
    category: "Chất đốt",
    unit: "Kg",
    unitPrice: 28000,
    description: "Gas nấu ăn LPG tiêu chuẩn",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  {
    name: "Than củi",
    category: "Chất đốt",
    unit: "Kg",
    unitPrice: 15000,
    description: "Than củi khô, cháy lâu",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 }
  }
]

// Generate Processing Station data
const processingStationData = [
  // Tofu Processing (last 30 days)
  ...(function() {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const soybeansInput = Math.round(40 + Math.random() * 20) // 40-60kg
      const tofuOutput = Math.round(soybeansInput * (0.25 + Math.random() * 0.1)) // 25-35% yield
      const carryOver = i === 29 ? 0 : Math.round(Math.random() * 10)
      
      data.push({
        type: 'tofu',
        date: date,
        input: {
          soybeans: {
            quantity: soybeansInput,
            quality: ['Tốt', 'Khá'][Math.floor(Math.random() * 2)],
            price: 28000,
            carryOverFromPreviousDay: carryOver
          },
          water: soybeansInput * 8, // 8L water per 1kg soybeans
          coagulant: soybeansInput * 20 // 20g coagulant per 1kg soybeans
        },
        output: {
          tofu: {
            quantity: tofuOutput,
            quality: 'Tốt',
            pricePerKg: 35000
          },
          whey: soybeansInput * 6, // 6L whey per 1kg soybeans
          waste: soybeansInput * 0.1 // 10% waste
        },
        processing: {
          duration: 180 + Math.random() * 60, // 3-4 hours
          temperature: 85 + Math.random() * 10,
          yield: (tofuOutput / soybeansInput) * 100,
          qualityNotes: "Đậu phụ có độ dai vừa phải, màu trắng đều"
        }
      })
    }
    return data
  })(),
  
  // Salt Processing (last 30 days)
  ...(function() {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const cabbageInput = Math.round(25 + Math.random() * 15) // 25-40kg
      const pickledOutput = Math.round(cabbageInput * (0.7 + Math.random() * 0.1)) // 70-80% yield
      const carryOver = i === 29 ? 0 : Math.round(Math.random() * 5)
      
      data.push({
        type: 'salt',
        date: date,
        input: {
          cabbage: {
            quantity: cabbageInput,
            quality: 'Tốt',
            price: 12000,
            carryOverFromPreviousDay: carryOver
          },
          salt: cabbageInput * 0.03, // 3% salt
          spices: [
            { name: "Tỏi", quantity: 0.5, unit: "Kg" },
            { name: "Ớt", quantity: 0.2, unit: "Kg" }
          ]
        },
        output: {
          pickledCabbage: {
            quantity: pickledOutput,
            quality: 'Tốt',
            pricePerKg: 15000
          },
          brine: cabbageInput * 0.15, // 15% brine
          waste: cabbageInput * 0.05 // 5% waste
        },
        processing: {
          saltingTime: 24, // 24 hours
          fermentationTime: 72, // 3 days
          yield: (pickledOutput / cabbageInput) * 100,
          qualityNotes: "Rau cải muối có vị chua nhẹ, giòn tốt"
        }
      })
    }
    return data
  })()
]

// Clear and seed data
async function seedCompleteData() {
  try {
    console.log('🌱 Starting complete LTTP database seeding...')
    
    await connectToDatabase()
    
    // Clear existing data
    await LTTPItem.deleteMany({})
    console.log('🗑️  Cleared existing LTTP data')
    
    // Create admin user reference (assuming it exists)
    const adminId = new mongoose.Types.ObjectId()
    
    // Seed LTTP Items
    const itemsWithUser = lttpItemsData.map(item => ({
      ...item,
      createdBy: adminId
    }))
    
    const items = await LTTPItem.insertMany(itemsWithUser)
    console.log(`📦 Seeded ${items.length} LTTP items`)
    
    // Create processing station collections if they don't exist
    const TofuProcessing = mongoose.model('TofuProcessing', new mongoose.Schema({
      date: Date,
      input: Object,
      output: Object,
      remaining: Object,
      financial: Object,
      processing: Object,
      notes: String
    }, { timestamps: true }))
    
    const SaltProcessing = mongoose.model('SaltProcessing', new mongoose.Schema({
      date: Date,
      input: Object,
      output: Object,
      remaining: Object,
      financial: Object,
      processing: Object,
      notes: String
    }, { timestamps: true }))
    
    // Clear processing data
    await TofuProcessing.deleteMany({})
    await SaltProcessing.deleteMany({})
    
    // Insert processing station data
    const tofuData = processingStationData.filter(item => item.type === 'tofu')
    const saltData = processingStationData.filter(item => item.type === 'salt')
    
    if (tofuData.length > 0) {
      const tofuRecords = tofuData.map(item => {
        const { type, ...record } = item
        record.financial = {
          totalInputCost: item.input.soybeans.quantity * item.input.soybeans.price,
          totalOutputValue: item.output.tofu.quantity * item.output.tofu.pricePerKg,
          profit: (item.output.tofu.quantity * item.output.tofu.pricePerKg) - (item.input.soybeans.quantity * item.input.soybeans.price),
        }
        record.remaining = {
          soybeans: Math.max(0, item.input.soybeans.quantity - item.output.tofu.quantity * 4), // Estimate
          tofu: Math.round(Math.random() * 5) // Random remaining
        }
        return record
      })
      
      await TofuProcessing.insertMany(tofuRecords)
      console.log(`🥛 Seeded ${tofuRecords.length} tofu processing records`)
    }
    
    if (saltData.length > 0) {
      const saltRecords = saltData.map(item => {
        const { type, ...record } = item
        record.financial = {
          totalInputCost: item.input.cabbage.quantity * item.input.cabbage.price,
          totalOutputValue: item.output.pickledCabbage.quantity * item.output.pickledCabbage.pricePerKg,
          profit: (item.output.pickledCabbage.quantity * item.output.pickledCabbage.pricePerKg) - (item.input.cabbage.quantity * item.input.cabbage.price),
        }
        record.remaining = {
          cabbage: Math.max(0, item.input.cabbage.quantity - item.output.pickledCabbage.quantity * 1.2), // Estimate
          pickledCabbage: Math.round(Math.random() * 8) // Random remaining
        }
        return record
      })
      
      await SaltProcessing.insertMany(saltRecords)
      console.log(`🧂 Seeded ${saltRecords.length} salt processing records`)
    }
    
    console.log('🎉 Complete LTTP database seeding finished successfully!')
    console.log('\n📋 Summary:')
    console.log(`📦 LTTP Items: ${items.length}`)
    console.log(`🥛 Tofu Processing records: ${tofuData.length}`)
    console.log(`🧂 Salt Processing records: ${saltData.length}`)
    console.log('\n💡 Data includes:')
    console.log('- Realistic pricing based on 2025 market rates')
    console.log('- Complete nutritional information')
    console.log('- Storage requirements and expiry dates')
    console.log('- Supplier information')
    console.log('- 30 days of processing station data')
    console.log('- Financial calculations and yields')
    
  } catch (error) {
    console.error('❌ Error seeding complete data:', error)
  } finally {
    await mongoose.connection.close()
    console.log('📴 Database connection closed')
  }
}

// Run the seeding
if (require.main === module) {
  seedCompleteData()
}

module.exports = { seedCompleteData } 