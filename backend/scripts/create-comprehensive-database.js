const mongoose = require('mongoose')
require('dotenv').config()

// Connect to database
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin'
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB:', uri)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Create comprehensive LTTP data
const comprehensiveLTTPData = [
  // Rice and grains
  { name: "Gạo tẻ loại 1", category: "Thực phẩm", unit: "Kg", unitPrice: 22000, shelfLife: 365 },
  { name: "Gạo nàng hương", category: "Thực phẩm", unit: "Kg", unitPrice: 28000, shelfLife: 365 },
  { name: "Bún khô", category: "Thực phẩm", unit: "Kg", unitPrice: 32000, shelfLife: 180 },
  { name: "Mì gói", category: "Thực phẩm", unit: "Thùng", unitPrice: 245000, shelfLife: 180 },
  
  // Meat and protein
  { name: "Thịt heo nạc", category: "Thực phẩm", unit: "Kg", unitPrice: 180000, shelfLife: 3 },
  { name: "Thịt heo ba chỉ", category: "Thực phẩm", unit: "Kg", unitPrice: 160000, shelfLife: 3 },
  { name: "Thịt bò nạc", category: "Thực phẩm", unit: "Kg", unitPrice: 280000, shelfLife: 3 },
  { name: "Thịt gà ta", category: "Thực phẩm", unit: "Kg", unitPrice: 120000, shelfLife: 3 },
  { name: "Cá tra fillet", category: "Thực phẩm", unit: "Kg", unitPrice: 85000, shelfLife: 2 },
  { name: "Cá basa fillet", category: "Thực phẩm", unit: "Kg", unitPrice: 75000, shelfLife: 2 },
  { name: "Tôm sú", category: "Thực phẩm", unit: "Kg", unitPrice: 320000, shelfLife: 1 },
  { name: "Trứng gà tươi", category: "Thực phẩm", unit: "Kg", unitPrice: 35000, shelfLife: 14 },
  
  // Vegetables
  { name: "Cà chua", category: "Rau củ quả", unit: "Kg", unitPrice: 25000, shelfLife: 7 },
  { name: "Rau cải ngọt", category: "Rau củ quả", unit: "Kg", unitPrice: 18000, shelfLife: 3 },
  { name: "Rau muống", category: "Rau củ quả", unit: "Kg", unitPrice: 15000, shelfLife: 2 },
  { name: "Bắp cải", category: "Rau củ quả", unit: "Kg", unitPrice: 12000, shelfLife: 14 },
  { name: "Củ cải trắng", category: "Rau củ quả", unit: "Kg", unitPrice: 15000, shelfLife: 14 },
  { name: "Cà rót", category: "Rau củ quả", unit: "Kg", unitPrice: 20000, shelfLife: 5 },
  { name: "Khoai tây", category: "Rau củ quả", unit: "Kg", unitPrice: 20000, shelfLife: 30 },
  { name: "Khoai lang", category: "Rau củ quả", unit: "Kg", unitPrice: 18000, shelfLife: 21 },
  { name: "Hành lá", category: "Rau củ quả", unit: "Kg", unitPrice: 45000, shelfLife: 5 },
  { name: "Hành tím", category: "Rau củ quả", unit: "Kg", unitPrice: 35000, shelfLife: 30 },
  
  // Seasonings and condiments
  { name: "Muối tinh", category: "Gia vị", unit: "Kg", unitPrice: 8000, shelfLife: 1095 },
  { name: "Đường cát trắng", category: "Gia vị", unit: "Kg", unitPrice: 22000, shelfLife: 730 },
  { name: "Nước mắm", category: "Gia vị", unit: "Lít", unitPrice: 35000, shelfLife: 1095 },
  { name: "Tương ớt", category: "Gia vị", unit: "Chai", unitPrice: 25000, shelfLife: 365 },
  { name: "Dầu ăn", category: "Gia vị", unit: "Lít", unitPrice: 48000, shelfLife: 540 },
  { name: "Tỏi tươi", category: "Gia vị", unit: "Kg", unitPrice: 55000, shelfLife: 60 },
  { name: "Gừng tươi", category: "Gia vị", unit: "Kg", unitPrice: 45000, shelfLife: 30 },
  { name: "Hạt tiêu", category: "Gia vị", unit: "Kg", unitPrice: 280000, shelfLife: 1095 },
  { name: "Bột ngọt", category: "Gia vị", unit: "Kg", unitPrice: 45000, shelfLife: 730 },
  { name: "Xì dầu", category: "Gia vị", unit: "Lít", unitPrice: 32000, shelfLife: 730 },
  
  // Processing ingredients
  { name: "Đậu nành khô", category: "Thực phẩm", unit: "Kg", unitPrice: 28000, shelfLife: 365 },
  { name: "Thạch cao thực phẩm", category: "Gia vị", unit: "Kg", unitPrice: 45000, shelfLife: 1095 },
  { name: "Ruột lợn", category: "Thực phẩm", unit: "Kg", unitPrice: 85000, shelfLife: 1 },
  
  // Fuel
  { name: "Gas LPG", category: "Chất đốt", unit: "Kg", unitPrice: 28000, shelfLife: 1095 },
  { name: "Than củi", category: "Chất đốt", unit: "Kg", unitPrice: 15000, shelfLife: 365 },
  
  // Tools and equipment
  { name: "Dao inox", category: "Dụng cụ", unit: "Cái", unitPrice: 85000, shelfLife: 1825 },
  { name: "Thớt gỗ", category: "Dụng cụ", unit: "Cái", unitPrice: 120000, shelfLife: 1095 },
  { name: "Nồi inox", category: "Dụng cụ", unit: "Cái", unitPrice: 450000, shelfLife: 3650 }
]

// Create processing station data for 60 days
function generateProcessingStationData() {
  const data = []
  const today = new Date()
  
  // Tofu processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const soybeansInput = 30 + Math.floor(Math.random() * 40) // 30-70kg
    const tofuOutput = Math.floor(soybeansInput * (0.25 + Math.random() * 0.1)) // 25-35% yield
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 15)
    
    data.push({
      collection: 'tofuprocessings',
      date: date,
      input: {
        soybeans: {
          quantity: soybeansInput,
          quality: ['Tốt', 'Khá', 'Trung bình'][Math.floor(Math.random() * 3)],
          price: 28000,
          carryOverFromPreviousDay: carryOver
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
        soybeans: Math.max(0, carryOver + soybeansInput - (tofuOutput * 4)),
        tofu: Math.floor(Math.random() * 10)
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
        qualityNotes: "Chất lượng đậu phụ đạt tiêu chuẩn"
      },
      notes: `Sản xuất đậu phụ ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  // Salt processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const cabbageInput = 20 + Math.floor(Math.random() * 30) // 20-50kg
    const pickledOutput = Math.floor(cabbageInput * (0.65 + Math.random() * 0.15)) // 65-80% yield
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 8)
    
    data.push({
      collection: 'saltprocessings',
      date: date,
      input: {
        cabbage: {
          quantity: cabbageInput,
          quality: 'Tốt',
          price: 12000,
          carryOverFromPreviousDay: carryOver
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
        cabbage: Math.max(0, carryOver + cabbageInput - Math.floor(pickledOutput * 1.2)),
        pickledCabbage: Math.floor(Math.random() * 8)
      },
      financial: {
        totalInputCost: cabbageInput * 12000 + Math.floor(cabbageInput * 0.03) * 8000,
        totalOutputValue: pickledOutput * 15000,
        profit: (pickledOutput * 15000) - (cabbageInput * 12000 + Math.floor(cabbageInput * 0.03) * 8000),
        profitMargin: ((pickledOutput * 15000) - (cabbageInput * 12000)) / (cabbageInput * 12000) * 100
      },
      processing: {
        saltingTime: 24,
        fermentationTime: 48 + Math.floor(Math.random() * 48),
        yield: (pickledOutput / cabbageInput) * 100,
        qualityNotes: "Rau cải muối đạt độ chua chuẩn"
      },
      notes: `Ướp muối rau cải ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  // Bean sprouts processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const soybeansInput = 15 + Math.floor(Math.random() * 25) // 15-40kg
    const sproutsOutput = Math.floor(soybeansInput * (3 + Math.random() * 2)) // 3-5x yield
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 5)
    
    data.push({
      collection: 'beansproutsprocessings',
      date: date,
      input: {
        soybeans: {
          quantity: soybeansInput,
          quality: 'Tốt',
          price: 28000,
          carryOverFromPreviousDay: carryOver
        },
        water: soybeansInput * 20
      },
      output: {
        beanSprouts: {
          quantity: sproutsOutput,
          quality: 'Tốt',
          pricePerKg: 20000
        },
        hulls: Math.floor(soybeansInput * 0.15),
        waste: Math.floor(soybeansInput * 0.05)
      },
      remaining: {
        soybeans: Math.max(0, carryOver + soybeansInput - Math.floor(sproutsOutput * 0.3)),
        beanSprouts: Math.floor(Math.random() * 5)
      },
      financial: {
        totalInputCost: soybeansInput * 28000,
        totalOutputValue: sproutsOutput * 20000,
        profit: (sproutsOutput * 20000) - (soybeansInput * 28000),
        profitMargin: ((sproutsOutput * 20000) - (soybeansInput * 28000)) / (soybeansInput * 28000) * 100
      },
      processing: {
        soakingTime: 8,
        sproutingTime: 72 + Math.floor(Math.random() * 24),
        temperature: 25 + Math.floor(Math.random() * 5),
        humidity: 80 + Math.floor(Math.random() * 15),
        yield: (sproutsOutput / soybeansInput),
        qualityNotes: "Giá đỗ trắng, giòn, không bị úng"
      },
      notes: `Ủ giá đỗ ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  // Sausage processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const porkInput = 15 + Math.floor(Math.random() * 20) // 15-35kg
    const sausageOutput = Math.floor(porkInput * (0.85 + Math.random() * 0.1)) // 85-95% yield
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 3)
    
    data.push({
      collection: 'sausageprocessings',
      date: date,
      input: {
        porkMeat: {
          quantity: porkInput,
          quality: 'Tốt',
          price: 180000,
          carryOverFromPreviousDay: carryOver
        },
        spices: [
          { name: "Muối", quantity: porkInput * 0.02, unit: "Kg", price: 8000 },
          { name: "Đường", quantity: porkInput * 0.01, unit: "Kg", price: 22000 },
          { name: "Hạt tiêu", quantity: porkInput * 0.005, unit: "Kg", price: 280000 }
        ],
        casings: Math.floor(porkInput * 2), // 2 pieces per kg
        otherIngredients: [
          { name: "Ruột lợn", quantity: porkInput * 0.1, unit: "Kg" }
        ]
      },
      output: {
        sausages: {
          quantity: sausageOutput,
          pieces: Math.floor(sausageOutput * 8), // 8 sausages per kg
          quality: 'Tốt',
          pricePerKg: 180000
        },
        trimming: Math.floor(porkInput * 0.05),
        waste: Math.floor(porkInput * 0.02)
      },
      remaining: {
        porkMeat: Math.max(0, carryOver + porkInput - sausageOutput),
        sausages: Math.floor(Math.random() * 3)
      },
      financial: {
        totalInputCost: porkInput * 180000 + (porkInput * 0.02 * 8000) + (porkInput * 0.01 * 22000),
        totalOutputValue: sausageOutput * 180000,
        profit: (sausageOutput * 180000) - (porkInput * 180000 + (porkInput * 0.02 * 8000)),
        profitMargin: ((sausageOutput * 180000) - (porkInput * 180000)) / (porkInput * 180000) * 100
      },
      processing: {
        grindingTime: 30,
        mixingTime: 45,
        stuffingTime: 90,
        cookingTime: 120,
        cookingTemperature: 75 + Math.floor(Math.random() * 10),
        yield: (sausageOutput / porkInput) * 100,
        qualityNotes: "Giò chả có độ dai vừa, màu hồng đều"
      },
      notes: `Làm giò chả ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  // Livestock processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const liveWeight = 50 + Math.floor(Math.random() * 100) // 50-150kg live weight
    const leanMeat = Math.floor(liveWeight * (0.45 + Math.random() * 0.1)) // 45-55% lean meat
    const bones = Math.floor(liveWeight * (0.15 + Math.random() * 0.05)) // 15-20% bones
    const groundMeat = Math.floor(liveWeight * (0.08 + Math.random() * 0.04)) // 8-12% ground meat
    const organs = Math.floor(liveWeight * (0.06 + Math.random() * 0.02)) // 6-8% organs
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 20)
    
    data.push({
      collection: 'livestockprocessings',
      date: date,
      input: {
        livePigs: {
          quantity: liveWeight,
          count: Math.floor(liveWeight / 80) || 1, // Average 80kg per pig
          avgWeight: liveWeight / (Math.floor(liveWeight / 80) || 1),
          quality: 'Tốt',
          price: 65000, // per kg live weight
          carryOverFromPreviousDay: carryOver
        }
      },
      output: {
        leanMeat: {
          quantity: leanMeat,
          quality: 'Tốt',
          pricePerKg: 200000
        },
        bones: {
          quantity: bones,
          pricePerKg: 30000
        },
        groundMeat: {
          quantity: groundMeat,
          pricePerKg: 150000
        },
        organs: {
          quantity: organs,
          pricePerKg: 80000
        },
        fat: Math.floor(liveWeight * 0.1),
        hide: Math.floor(liveWeight * 0.08),
        waste: Math.floor(liveWeight * 0.05)
      },
      remaining: {
        livePigs: Math.max(0, carryOver - liveWeight),
        leanMeat: Math.floor(Math.random() * 5),
        bones: Math.floor(Math.random() * 3),
        groundMeat: Math.floor(Math.random() * 2),
        organs: Math.floor(Math.random() * 2)
      },
      financial: {
        totalInputCost: liveWeight * 65000,
        totalOutputValue: (leanMeat * 200000) + (bones * 30000) + (groundMeat * 150000) + (organs * 80000),
        profit: ((leanMeat * 200000) + (bones * 30000) + (groundMeat * 150000) + (organs * 80000)) - (liveWeight * 65000),
        profitMargin: (((leanMeat * 200000) + (bones * 30000) + (groundMeat * 150000) + (organs * 80000)) - (liveWeight * 65000)) / (liveWeight * 65000) * 100
      },
      processing: {
        slaughterTime: new Date(date.getTime() + 6 * 60 * 60 * 1000), // 6 AM
        processingTime: 180 + Math.floor(Math.random() * 60),
        dressingPercentage: ((leanMeat + bones + groundMeat + organs) / liveWeight) * 100,
        meatYield: (leanMeat / liveWeight) * 100,
        qualityNotes: "Thịt tươi ngon, đạt tiêu chuẩn vệ sinh",
        veterinaryCheck: {
          passed: true,
          checkedBy: "Bác sĩ thú y Nguyễn Văn A",
          notes: "Đạt tiêu chuẩn an toàn thực phẩm"
        }
      },
      notes: `Giết mổ lợn ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  // Poultry processing
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const liveWeight = 20 + Math.floor(Math.random() * 30) // 20-50kg total
    const processedMeat = Math.floor(liveWeight * (0.65 + Math.random() * 0.1)) // 65-75% yield
    const carryOver = i === 59 ? 0 : Math.floor(Math.random() * 10)
    
    data.push({
      collection: 'poultryprocessings',
      date: date,
      input: {
        livePoultry: {
          quantity: liveWeight,
          count: Math.floor(liveWeight / 2.5) || 1, // Average 2.5kg per bird
          avgWeight: liveWeight / (Math.floor(liveWeight / 2.5) || 1),
          type: ['Gà', 'Vịt'][Math.floor(Math.random() * 2)],
          quality: 'Tốt',
          price: 60000, // per kg live weight
          carryOverFromPreviousDay: carryOver
        }
      },
      output: {
        processedMeat: {
          quantity: processedMeat,
          quality: 'Tốt',
          pricePerKg: 150000
        },
        bones: Math.floor(liveWeight * 0.15),
        feathers: Math.floor(liveWeight * 0.08),
        organs: Math.floor(liveWeight * 0.05),
        waste: Math.floor(liveWeight * 0.03)
      },
      remaining: {
        livePoultry: Math.max(0, carryOver - liveWeight),
        processedMeat: Math.floor(Math.random() * 3)
      },
      financial: {
        totalInputCost: liveWeight * 60000,
        totalOutputValue: processedMeat * 150000,
        profit: (processedMeat * 150000) - (liveWeight * 60000),
        profitMargin: ((processedMeat * 150000) - (liveWeight * 60000)) / (liveWeight * 60000) * 100
      },
      processing: {
        slaughterTime: new Date(date.getTime() + 7 * 60 * 60 * 1000), // 7 AM
        processingTime: 90 + Math.floor(Math.random() * 30),
        dressingPercentage: (processedMeat / liveWeight) * 100,
        yield: (processedMeat / liveWeight) * 100,
        qualityNotes: "Thịt gia cầm tươi ngon"
      },
      notes: `Giết mổ gia cầm ngày ${date.toLocaleDateString('vi-VN')}`
    })
  }
  
  return data
}

// Main seeding function
async function createComprehensiveDatabase() {
  try {
    console.log('🌱 Creating comprehensive military logistics database...')
    
    await connectDB()
    
    // Drop existing collections
    const collections = ['lttpitems', 'tofuprocessings', 'saltprocessings', 'beansproutsprocessings', 'sausageprocessings', 'livestockprocessings', 'poultryprocessings']
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).drop()
        console.log(`🗑️  Dropped ${collection} collection`)
      } catch (error) {
        // Collection might not exist
      }
    }
    
    // Create LTTP Items
    const LTTPItem = mongoose.model('LTTPItem', new mongoose.Schema({
      name: String,
      category: String,
      unit: String,
      unitPrice: Number,
      shelfLife: Number,
      isActive: { type: Boolean, default: true }
    }))
    
    const lttpItems = await LTTPItem.insertMany(comprehensiveLTTPData)
    console.log(`📦 Created ${lttpItems.length} LTTP items`)
    
    // Create processing station collections and data
    const processingData = generateProcessingStationData()
    const collectionGroups = {}
    
    // Group data by collection
    processingData.forEach(item => {
      const { collection, ...data } = item
      if (!collectionGroups[collection]) {
        collectionGroups[collection] = []
      }
      collectionGroups[collection].push(data)
    })
    
    // Insert data for each collection
    for (const [collectionName, data] of Object.entries(collectionGroups)) {
      const Collection = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }))
      await Collection.insertMany(data)
      console.log(`🏭 Created ${data.length} records in ${collectionName}`)
    }
    
    // Create LTTP Inventory for last 30 days
    const LTTPInventory = mongoose.model('LTTPInventory', new mongoose.Schema({}, { strict: false }))
    const inventoryData = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      lttpItems.forEach(item => {
        const baseQty = getBaseQuantity(item.name)
        const inputQty = Math.floor(baseQty * (0.8 + Math.random() * 0.4)) // 80-120% variation
        const outputQty = Math.floor(inputQty * (0.7 + Math.random() * 0.2)) // 70-90% output
        const previousQty = i === 29 ? Math.floor(baseQty * 0.3) : 0
        
        inventoryData.push({
          date: date,
          lttpItemId: item._id,
          previousDay: {
            quantity: previousQty,
            amount: previousQty * item.unitPrice,
            expiryDate: new Date(date.getTime() + item.shelfLife * 24 * 60 * 60 * 1000)
          },
          input: {
            quantity: inputQty,
            amount: inputQty * item.unitPrice,
            expiryDate: new Date(date.getTime() + item.shelfLife * 24 * 60 * 60 * 1000),
            notes: `Nhập kho ${item.name}`
          },
          output: {
            quantity: outputQty,
            amount: outputQty * item.unitPrice,
            distributedTo: [],
            notes: `Xuất kho ${item.name}`
          },
          endOfDay: {
            quantity: previousQty + inputQty - outputQty,
            amount: (previousQty + inputQty - outputQty) * item.unitPrice,
            expiryDate: new Date(date.getTime() + item.shelfLife * 24 * 60 * 60 * 1000)
          },
          status: getRandomStatus()
        })
      })
    }
    
    await LTTPInventory.insertMany(inventoryData)
    console.log(`📊 Created ${inventoryData.length} inventory records`)
    
    console.log('\n🎉 Comprehensive database creation completed!')
    console.log('\n📋 Database Summary:')
    console.log(`📦 LTTP Items: ${lttpItems.length}`)
    console.log(`🥛 Tofu Processing: ${collectionGroups.tofuprocessings?.length || 0} records`)
    console.log(`🧂 Salt Processing: ${collectionGroups.saltprocessings?.length || 0} records`)
    console.log(`🌱 Bean Sprouts: ${collectionGroups.beansproutsprocessings?.length || 0} records`)
    console.log(`🌭 Sausage Processing: ${collectionGroups.sausageprocessings?.length || 0} records`)
    console.log(`🐷 Livestock Processing: ${collectionGroups.livestockprocessings?.length || 0} records`)
    console.log(`🐔 Poultry Processing: ${collectionGroups.poultryprocessings?.length || 0} records`)
    console.log(`📊 Inventory Records: ${inventoryData.length}`)
    console.log('\n✨ Database is ready for production use!')
    
  } catch (error) {
    console.error('❌ Error creating comprehensive database:', error)
  } finally {
    await mongoose.connection.close()
    console.log('📴 Database connection closed')
  }
}

function getBaseQuantity(itemName) {
  const quantities = {
    "Gạo tẻ loại 1": 100,
    "Gạo nàng hương": 50,
    "Thịt heo nạc": 40,
    "Thịt heo ba chỉ": 30,
    "Thịt gà ta": 25,
    "Cá tra fillet": 30,
    "Trứng gà tươi": 20,
    "Cà chua": 25,
    "Rau cải ngọt": 20,
    "Bắp cải": 30,
    "Đậu nành khô": 60,
    "Muối tinh": 10,
    "Dầu ăn": 15
  }
  return quantities[itemName] || 15
}

function getRandomStatus() {
  const statuses = ['Tốt', 'Bình thường', 'Sắp hết hạn']
  const weights = [0.7, 0.25, 0.05] // 70% good, 25% normal, 5% near expiry
  const random = Math.random()
  let sum = 0
  
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i]
    if (random < sum) {
      return statuses[i]
    }
  }
  return statuses[0]
}

// Run if called directly
if (require.main === module) {
  createComprehensiveDatabase()
}

module.exports = { createComprehensiveDatabase } 