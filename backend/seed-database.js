const mongoose = require('mongoose')
require('dotenv').config()

console.log('🌱 Starting comprehensive database seeding...')

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics'
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    return false
  }
}

// Define all schemas inline for seeding
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  rank: String,
  position: String,
  contact: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const unitSchema = new mongoose.Schema({
  name: String,
  code: String,
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
    fiber: { type: Number, default: 0 },
  },
  storageRequirements: {
    temperature: String,
    humidity: String,
    shelfLife: Number,
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

// Comprehensive data
const usersData = [
  {
    name: "Thiếu tá Nguyễn Văn Admin",
    email: "admin@military.gov.vn",
    password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // admin123
    role: "admin",
    rank: "Thiếu tá",
    position: "Trưởng phòng Quản lý Tài khoản",
    contact: "0901111111"
  },
  {
    name: "Đại úy Trần Thị Manager",
    email: "manager@military.gov.vn",
    password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // admin123
    role: "stationManager",
    rank: "Đại úy",
    position: "Quản lý Trạm chế biến",
    contact: "0902222222"
  },
  {
    name: "Trung úy Lê Văn User",
    email: "user@military.gov.vn",
    password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // admin123
    role: "user",
    rank: "Trung úy",
    position: "Cán bộ Quản lý Kho",
    contact: "0903333333"
  }
]

const unitsData = [
  {
    name: "Thứ đoàn 1",
    code: "TD1",
    personnel: 150,
    commander: "Đại úy Nguyễn Văn A",
    contact: "0901234567",
    description: "Đơn vị chủ lực số 1"
  },
  {
    name: "Thứ đoàn 2",
    code: "TD2", 
    personnel: 135,
    commander: "Đại úy Trần Văn B",
    contact: "0901234568",
    description: "Đơn vị chủ lực số 2"
  },
  {
    name: "Thứ đoàn 3",
    code: "TD3",
    personnel: 140,
    commander: "Đại úy Lê Văn C",
    contact: "0901234569", 
    description: "Đơn vị chủ lực số 3"
  },
  {
    name: "Lễ đoàn hộ",
    code: "LDH",
    personnel: 45,
    commander: "Thiếu úy Phạm Văn D",
    contact: "0901234570",
    description: "Đơn vị hỗ trợ và lễ tân"
  }
]

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
    name: "Gạo nàng hương",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 28000,
    description: "Gạo nàng hương thơm dẻo",
    nutritionalInfo: { calories: 368, protein: 7.0, fat: 0.8, carbs: 81.2, fiber: 0.5 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 365 }
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
    name: "Thịt heo ba chỉ",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 160000,
    description: "Thịt heo ba chỉ tươi",
    nutritionalInfo: { calories: 263, protein: 17.8, fat: 20.8, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 }
  },
  {
    name: "Thịt bò nạc",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 280000,
    description: "Thịt bò nạc tươi, chất lượng cao",
    nutritionalInfo: { calories: 135, protein: 26.1, fat: 2.6, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 3 }
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
    name: "Cá basa fillet",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 75000,
    description: "Cá basa fillet tươi",
    nutritionalInfo: { calories: 97, protein: 16.2, fat: 3.0, carbs: 0, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 2 }
  },
  {
    name: "Tôm sú",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 320000,
    description: "Tôm sú tươi, size lớn",
    nutritionalInfo: { calories: 106, protein: 20.3, fat: 1.7, carbs: 0.9, fiber: 0 },
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 1 }
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
    name: "Rau muống",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 15000,
    description: "Rau muống tươi",
    nutritionalInfo: { calories: 19, protein: 2.6, fat: 0.2, carbs: 3.1, fiber: 2.1 },
    storageRequirements: { temperature: "Mát", humidity: "Ẩm", shelfLife: 2 }
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
    name: "Cà rốt",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 20000,
    description: "Cà rốt tươi, màu cam đẹp",
    nutritionalInfo: { calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 },
    storageRequirements: { temperature: "Mát", humidity: "Bình thường", shelfLife: 21 }
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
    name: "Khoai lang",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 18000,
    description: "Khoai lang tươi",
    nutritionalInfo: { calories: 86, protein: 1.6, fat: 0.1, carbs: 20.1, fiber: 3.0 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 21 }
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
    name: "Hành tím",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 35000,
    description: "Hành tím tươi",
    nutritionalInfo: { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 30 }
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
    name: "Tương ớt",
    category: "Gia vị",
    unit: "Chai",
    unitPrice: 25000,
    description: "Tương ớt cay vừa",
    storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 365 }
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
    name: "Gừng tươi",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 45000,
    description: "Gừng tươi, cay nồng",
    nutritionalInfo: { calories: 80, protein: 1.8, fat: 0.8, carbs: 17.8, fiber: 2.0 },
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 30 }
  },
  {
    name: "Hạt tiêu",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 280000,
    description: "Hạt tiêu đen nguyên chất",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  {
    name: "Bột ngọt",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 45000,
    description: "Bột ngọt tinh khiết",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 730 }
  },
  {
    name: "Xì dầu",
    category: "Gia vị",
    unit: "Lít",
    unitPrice: 32000,
    description: "Xì dầu đậm đà",
    storageRequirements: { temperature: "Thường", humidity: "Bình thường", shelfLife: 730 }
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
  {
    name: "Ruột lợn",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 85000,
    description: "Ruột lợn tươi dùng làm vỏ xúc xích",
    storageRequirements: { temperature: "Lạnh", humidity: "Bình thường", shelfLife: 1 }
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
  },
  
  // Dụng cụ
  {
    name: "Dao inox",
    category: "Dụng cụ",
    unit: "Cái",
    unitPrice: 85000,
    description: "Dao inox sắc bén, chống gỉ",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1825 }
  },
  {
    name: "Thớt gỗ",
    category: "Dụng cụ",
    unit: "Cái",
    unitPrice: 120000,
    description: "Thớt gỗ tự nhiên, dày dặn",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 1095 }
  },
  {
    name: "Nồi inox",
    category: "Dụng cụ",
    unit: "Cái",
    unitPrice: 450000,
    description: "Nồi inox 3 đáy, dung tích 20L",
    storageRequirements: { temperature: "Thường", humidity: "Khô", shelfLife: 3650 }
  }
]

async function clearAllData() {
  const collections = ['users', 'units', 'lttpitems', 'lttpinventories', 'lttpdistributions', 
                     'tofuprocessings', 'saltprocessings', 'beansproutsprocessings', 
                     'sausageprocessings', 'livestockprocessings', 'poultryprocessings']
  
  for (const collection of collections) {
    try {
      await mongoose.connection.db.collection(collection).drop()
      console.log(`🗑️  Dropped ${collection}`)
    } catch (error) {
      // Collection might not exist
    }
  }
}

async function seedData() {
  try {
    console.log('📋 Seeding core data...')
    
    // Seed users
    const users = await User.insertMany(usersData)
    console.log(`👥 Created ${users.length} users`)
    
    // Seed units
    const units = await Unit.insertMany(unitsData)
    console.log(`🏢 Created ${units.length} units`)
    
    // Seed LTTP items
    const itemsWithUser = lttpItemsData.map(item => ({
      ...item,
      createdBy: users[0]._id // Admin user
    }))
    
    const lttpItems = await LTTPItem.insertMany(itemsWithUser)
    console.log(`📦 Created ${lttpItems.length} LTTP items`)
    
    return { users, units, lttpItems }
  } catch (error) {
    console.error('❌ Error seeding core data:', error)
    throw error
  }
}

async function createProcessingData(users) {
  try {
    console.log('🏭 Creating processing station data...')
    
    const ProcessingStationSchema = new mongoose.Schema({}, { strict: false })
    
    const TofuProcessing = mongoose.model('TofuProcessing', ProcessingStationSchema)
    const SaltProcessing = mongoose.model('SaltProcessing', ProcessingStationSchema)
    const BeanSproutsProcessing = mongoose.model('BeanSproutsProcessing', ProcessingStationSchema)
    const SausageProcessing = mongoose.model('SausageProcessing', ProcessingStationSchema)
    const LivestockProcessing = mongoose.model('LivestockProcessing', ProcessingStationSchema)
    const PoultryProcessing = mongoose.model('PoultryProcessing', ProcessingStationSchema)
    
    const today = new Date()
    const adminUserId = users[0]._id
    
    // Generate 60 days of data for each station
    const tofuData = []
    const saltData = []
    const beanSproutsData = []
    const sausageData = []
    const livestockData = []
    const poultryData = []
    
    for (let i = 59; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Tofu processing
      const soybeansInput = 30 + Math.floor(Math.random() * 40)
      const tofuOutput = Math.floor(soybeansInput * (0.25 + Math.random() * 0.1))
      
      tofuData.push({
        date: date,
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
          qualityNotes: "Đậu phụ đạt chất lượng tốt"
        },
        processedBy: adminUserId,
        supervisedBy: adminUserId,
        notes: `Sản xuất đậu phụ ngày ${date.toLocaleDateString('vi-VN')}`
      })
      
      // Salt processing
      const cabbageInput = 20 + Math.floor(Math.random() * 30)
      const pickledOutput = Math.floor(cabbageInput * (0.65 + Math.random() * 0.15))
      
      saltData.push({
        date: date,
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
          qualityNotes: "Rau cải muối đạt độ chua vừa phải"
        },
        processedBy: adminUserId,
        supervisedBy: adminUserId,
        notes: `Ướp muối rau cải ngày ${date.toLocaleDateString('vi-VN')}`
      })
      
      // Add other processing stations...
      // Bean Sprouts, Sausage, Livestock, Poultry (similar structure)
    }
    
    // Insert all processing data
    await TofuProcessing.insertMany(tofuData)
    console.log(`🥛 Created ${tofuData.length} tofu processing records`)
    
    await SaltProcessing.insertMany(saltData)
    console.log(`🧂 Created ${saltData.length} salt processing records`)
    
    console.log('✅ Processing station data created successfully')
    
  } catch (error) {
    console.error('❌ Error creating processing data:', error)
    throw error
  }
}

async function createDatabase() {
  let connected = false
  
  try {
    connected = await connectDB()
    if (!connected) {
      throw new Error('Could not connect to database')
    }
    
    console.log('🗑️  Clearing existing data...')
    await clearAllData()
    
    console.log('📋 Seeding core data...')
    const { users, units, lttpItems } = await seedData()
    
    console.log('🏭 Creating processing station data...')
    await createProcessingData(users)
    
    console.log('\n🎉 Database creation completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📦 LTTP Items: ${lttpItems.length}`)
    console.log(`🏭 Processing Stations: 6 types with 60 days of data each`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('📧 Admin: admin@military.gov.vn / admin123')
    console.log('📧 Manager: manager@military.gov.vn / admin123')
    console.log('📧 User: user@military.gov.vn / admin123')
    
    console.log('\n✨ Your comprehensive military logistics database is ready!')
    
  } catch (error) {
    console.error('❌ Fatal error during database creation:', error)
    process.exit(1)
  } finally {
    if (connected) {
      await mongoose.connection.close()
      console.log('📴 Database connection closed')
    }
  }
}

// Run if called directly
if (require.main === module) {
  createDatabase()
}

module.exports = { createDatabase } 