const mongoose = require('mongoose')
const { LTTPItem } = require('../src/models/lttp-item.model')
const { LTTPInventory } = require('../src/models/lttp-inventory.model')
const { LTTPDistribution } = require('../src/models/lttp-distribution.model')
const { User } = require('../src/models/user.model')
const { Unit } = require('../src/models/unit.model')
require('dotenv').config()

// LTTP Items seed data với giá thực tế năm 2025
const lttpItemsData = [
  // Thực phẩm chính
  {
    name: "Gạo tẻ loại 1",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 22000,
    description: "Gạo tẻ chất lượng cao, dành cho nấu cơm hàng ngày",
    nutritionalInfo: {
      calories: 365,
      protein: 7.1,
      fat: 0.7,
      carbs: 80.9,
      fiber: 0.4
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 365
    },
    supplier: {
      name: "Công ty TNHH Lương thực Miền Nam",
      contact: "0909123456",
      address: "123 Đường ABC, Quận 1, TP.HCM"
    }
  },
  {
    name: "Thịt heo nạc",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 180000,
    description: "Thịt heo nạc tươi, đạt tiêu chuẩn vệ sinh an toàn thực phẩm",
    nutritionalInfo: {
      calories: 143,
      protein: 20.9,
      fat: 6.4,
      carbs: 0,
      fiber: 0
    },
    storageRequirements: {
      temperature: "Lạnh",
      humidity: "Bình thường",
      shelfLife: 3
    },
    supplier: {
      name: "Công ty CP Chăn nuôi Việt Nam",
      contact: "0908765432",
      address: "456 Đường XYZ, Quận 2, TP.HCM"
    }
  },
  {
    name: "Cá tra fillet",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 85000,
    description: "Cá tra fillet tươi, không chất bảo quản",
    nutritionalInfo: {
      calories: 90,
      protein: 15.0,
      fat: 2.5,
      carbs: 0,
      fiber: 0
    },
    storageRequirements: {
      temperature: "Lạnh",
      humidity: "Bình thường",
      shelfLife: 2
    }
  },
  {
    name: "Trứng gà tươi",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 35000,
    description: "Trứng gà tươi, size 2-3",
    nutritionalInfo: {
      calories: 155,
      protein: 13.0,
      fat: 11.0,
      carbs: 1.1,
      fiber: 0
    },
    storageRequirements: {
      temperature: "Mát",
      humidity: "Bình thường",
      shelfLife: 14
    }
  },
  
  // Rau củ quả
  {
    name: "Cà chua",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 25000,
    description: "Cà chua tươi, màu đỏ chín",
    nutritionalInfo: {
      calories: 18,
      protein: 0.9,
      fat: 0.2,
      carbs: 3.9,
      fiber: 1.2
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Bình thường",
      shelfLife: 7
    }
  },
  {
    name: "Rau cải ngọt",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 18000,
    description: "Rau cải ngọt tươi, xanh non",
    nutritionalInfo: {
      calories: 13,
      protein: 1.5,
      fat: 0.2,
      carbs: 2.2,
      fiber: 1.2
    },
    storageRequirements: {
      temperature: "Mát",
      humidity: "Ẩm",
      shelfLife: 3
    }
  },
  {
    name: "Củ cải trắng",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 15000,
    description: "Củ cải trắng tươi, to đều",
    nutritionalInfo: {
      calories: 18,
      protein: 0.6,
      fat: 0.1,
      carbs: 4.1,
      fiber: 1.6
    },
    storageRequirements: {
      temperature: "Mát",
      humidity: "Bình thường",
      shelfLife: 14
    }
  },
  {
    name: "Hành lá",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 45000,
    description: "Hành lá tươi, thơm",
    nutritionalInfo: {
      calories: 32,
      protein: 1.8,
      fat: 0.2,
      carbs: 7.3,
      fiber: 2.6
    },
    storageRequirements: {
      temperature: "Mát",
      humidity: "Ẩm",
      shelfLife: 5
    }
  },
  {
    name: "Khoai tây",
    category: "Rau củ quả",
    unit: "Kg",
    unitPrice: 20000,
    description: "Khoai tây tươi, vỏ sạch",
    nutritionalInfo: {
      calories: 77,
      protein: 2.0,
      fat: 0.1,
      carbs: 17.6,
      fiber: 2.2
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 30
    }
  },
  
  // Gia vị
  {
    name: "Muối tinh",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 8000,
    description: "Muối tinh khiết, không iod",
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 1095
    }
  },
  {
    name: "Đường cát trắng",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 22000,
    description: "Đường cát trắng tinh khiết",
    nutritionalInfo: {
      calories: 387,
      protein: 0,
      fat: 0,
      carbs: 99.8,
      fiber: 0
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 730
    }
  },
  {
    name: "Nước mắm",
    category: "Gia vị",
    unit: "Lít",
    unitPrice: 35000,
    description: "Nước mắm truyền thống độ đạm 30",
    storageRequirements: {
      temperature: "Thường",
      humidity: "Bình thường",
      shelfLife: 1095
    }
  },
  {
    name: "Dầu ăn",
    category: "Gia vị",
    unit: "Lít",
    unitPrice: 48000,
    description: "Dầu ăn thực vật cao cấp",
    nutritionalInfo: {
      calories: 884,
      protein: 0,
      fat: 100,
      carbs: 0,
      fiber: 0
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 540
    }
  },
  {
    name: "Tỏi tươi",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 55000,
    description: "Tỏi tươi, múi to đều",
    nutritionalInfo: {
      calories: 149,
      protein: 6.4,
      fat: 0.5,
      carbs: 33.1,
      fiber: 2.1
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 60
    }
  },
  
  // Chất đốt
  {
    name: "Gas LPG",
    category: "Chất đốt",
    unit: "Kg",
    unitPrice: 28000,
    description: "Gas nấu ăn LPG tiêu chuẩn",
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 1095
    }
  },
  
  // Đậu phụ - nguyên liệu chế biến
  {
    name: "Đậu nành khô",
    category: "Thực phẩm",
    unit: "Kg",
    unitPrice: 28000,
    description: "Đậu nành khô chất lượng cao để làm đậu phụ",
    nutritionalInfo: {
      calories: 446,
      protein: 36.5,
      fat: 19.9,
      carbs: 30.2,
      fiber: 9.3
    },
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 365
    }
  },
  {
    name: "Thạch cao thực phẩm",
    category: "Gia vị",
    unit: "Kg",
    unitPrice: 45000,
    description: "Thạch cao thực phẩm dùng làm đậu phụ",
    storageRequirements: {
      temperature: "Thường",
      humidity: "Khô",
      shelfLife: 1095
    }
  }
]

// Units data
const unitsData = [
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
]

// Users data
const usersData = [
  {
    name: "Nguyễn Văn Admin",
    email: "admin@military.gov.vn",
    password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // password: admin123
    role: "admin",
    rank: "Thiếu tá",
    position: "Trưởng phòng QLTK",
    contact: "0901111111"
  },
  {
    name: "Trần Thị Manager",
    email: "manager@military.gov.vn", 
    password: "$2b$10$kQZc5yFqVhHjGGhRtqTNEODMGwqOPkzJjJ5wKpFhNVxYtQwER7uNK", // password: admin123
    role: "stationManager",
    rank: "Đại úy",
    position: "Quản lý trạm chế biến",
    contact: "0902222222"
  }
]

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics')
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Clear existing data
async function clearData() {
  try {
    await LTTPItem.deleteMany({})
    await LTTPInventory.deleteMany({})
    await LTTPDistribution.deleteMany({})
    await User.deleteMany({})
    await Unit.deleteMany({})
    console.log('🗑️  Cleared existing data')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
  }
}

// Seed users
async function seedUsers() {
  try {
    const users = await User.insertMany(usersData)
    console.log(`👥 Seeded ${users.length} users`)
    return users
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    return []
  }
}

// Seed units
async function seedUnits() {
  try {
    const units = await Unit.insertMany(unitsData)
    console.log(`🏢 Seeded ${units.length} units`)
    return units
  } catch (error) {
    console.error('❌ Error seeding units:', error)
    return []
  }
}

// Seed LTTP items
async function seedLTTPItems(adminUser) {
  try {
    const itemsWithUser = lttpItemsData.map(item => ({
      ...item,
      createdBy: adminUser._id
    }))
    
    const items = await LTTPItem.insertMany(itemsWithUser)
    console.log(`📦 Seeded ${items.length} LTTP items`)
    return items
  } catch (error) {
    console.error('❌ Error seeding LTTP items:', error)
    return []
  }
}

// Generate inventory data for the last 30 days
async function generateInventoryData(lttpItems, adminUser) {
  try {
    const inventories = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      for (const item of lttpItems) {
        // Generate realistic inventory data
        const baseQuantity = getBaseQuantityForItem(item.name)
        const dayVariation = Math.random() * 0.3 + 0.85 // 85-115% variation
        
        const inputQuantity = Math.round(baseQuantity * dayVariation)
        const outputQuantity = Math.round(inputQuantity * (Math.random() * 0.2 + 0.7)) // 70-90% output
        const previousQuantity = i === 29 ? Math.round(baseQuantity * 0.5) : 0 // Starting inventory
        
        const inputAmount = inputQuantity * item.unitPrice
        const outputAmount = outputQuantity * item.unitPrice
        const previousAmount = previousQuantity * item.unitPrice
        
        // Calculate expiry date
        const expiryDate = new Date(date)
        expiryDate.setDate(expiryDate.getDate() + item.storageRequirements.shelfLife)
        
        const inventory = {
          date: new Date(date),
          lttpItemId: item._id,
          previousDay: {
            quantity: previousQuantity,
            amount: previousAmount,
            expiryDate: i === 29 ? expiryDate : null
          },
          input: {
            quantity: inputQuantity,
            amount: inputAmount,
            expiryDate,
            receivedBy: adminUser._id,
            notes: `Nhập kho ngày ${date.toLocaleDateString('vi-VN')}`
          },
          output: {
            quantity: outputQuantity,
            amount: outputAmount,
            expiryDate,
            distributedTo: [
              {
                unitId: null, // Will be filled later
                quantity: outputQuantity,
                amount: outputAmount,
                requestedBy: adminUser._id,
                approvedBy: adminUser._id,
                purpose: 'meal'
              }
            ],
            notes: `Xuất kho ngày ${date.toLocaleDateString('vi-VN')}`
          },
          createdBy: adminUser._id
        }
        
        inventories.push(inventory)
      }
    }
    
    const savedInventories = await LTTPInventory.insertMany(inventories)
    console.log(`📊 Generated ${savedInventories.length} inventory records for 30 days`)
    return savedInventories
  } catch (error) {
    console.error('❌ Error generating inventory data:', error)
    return []
  }
}

// Helper function to get base quantity for different items
function getBaseQuantityForItem(itemName) {
  const quantities = {
    "Gạo tẻ loại 1": 50,
    "Thịt heo nạc": 25,
    "Cá tra fillet": 20,
    "Trứng gà tươi": 15,
    "Cà chua": 20,
    "Rau cải ngọt": 15,
    "Củ cải trắng": 18,
    "Hành lá": 5,
    "Khoai tây": 25,
    "Muối tinh": 3,
    "Đường cát trắng": 8,
    "Nước mắm": 5,
    "Dầu ăn": 10,
    "Tỏi tươi": 3,
    "Gas LPG": 15,
    "Đậu nành khô": 20,
    "Thạch cao thực phẩm": 2
  }
  
  return quantities[itemName] || 10
}

// Generate distribution data for the last 7 days
async function generateDistributionData(lttpItems, units, adminUser) {
  try {
    const distributions = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Select a few items for distribution each day
      const selectedItems = lttpItems.filter((_, index) => index % 3 === i % 3)
      
      for (const item of selectedItems) {
        const totalSuggested = getBaseQuantityForItem(item.name)
        const actualVariation = Math.random() * 0.2 + 0.9 // 90-110%
        
        // Distribute among units based on personnel
        const totalPersonnel = units.reduce((sum, unit) => sum + unit.personnel, 0)
        
        const distribution = {
          date: new Date(date),
          lttpItemId: item._id,
          totalSuggestedQuantity: totalSuggested,
          
          unit1: {
            unitId: units[0]._id,
            suggestedQuantity: Math.round((totalSuggested * units[0].personnel) / totalPersonnel),
            actualQuantity: Math.round((totalSuggested * units[0].personnel * actualVariation) / totalPersonnel),
            personnelCount: units[0].personnel,
            status: 'completed',
            distributedAt: date,
            distributedBy: adminUser._id
          },
          
          unit2: {
            unitId: units[1]._id,
            suggestedQuantity: Math.round((totalSuggested * units[1].personnel) / totalPersonnel),
            actualQuantity: Math.round((totalSuggested * units[1].personnel * actualVariation) / totalPersonnel),
            personnelCount: units[1].personnel,
            status: 'completed',
            distributedAt: date,
            distributedBy: adminUser._id
          },
          
          unit3: {
            unitId: units[2]._id,
            suggestedQuantity: Math.round((totalSuggested * units[2].personnel) / totalPersonnel),
            actualQuantity: Math.round((totalSuggested * units[2].personnel * actualVariation) / totalPersonnel),
            personnelCount: units[2].personnel,
            status: 'completed',
            distributedAt: date,
            distributedBy: adminUser._id
          },
          
          ceremonyUnit: {
            unitId: units[3]._id,
            suggestedQuantity: Math.round((totalSuggested * units[3].personnel) / totalPersonnel),
            actualQuantity: Math.round((totalSuggested * units[3].personnel * actualVariation) / totalPersonnel),
            personnelCount: units[3].personnel,
            status: 'completed',
            distributedAt: date,
            distributedBy: adminUser._id
          },
          
          overallStatus: 'completed',
          
          approvalFlow: {
            requestedBy: adminUser._id,
            requestedAt: new Date(date.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            approvedBy: adminUser._id,
            approvedAt: new Date(date.getTime() - 1 * 60 * 60 * 1000), // 1 hour before
            approvalNotes: `Phê duyệt phân bổ ngày ${date.toLocaleDateString('vi-VN')}`
          },
          
          distribution: {
            startedAt: new Date(date.getTime() - 30 * 60 * 1000), // 30 minutes before
            completedAt: date,
            distributionNotes: `Hoàn thành phân bổ ${item.name}`
          },
          
          budget: {
            allocatedAmount: totalSuggested * item.unitPrice,
            budgetPeriod: 'daily'
          },
          
          createdBy: adminUser._id
        }
        
        // Calculate amounts after setting quantities
        distribution.unit1.amount = distribution.unit1.actualQuantity * item.unitPrice
        distribution.unit2.amount = distribution.unit2.actualQuantity * item.unitPrice
        distribution.unit3.amount = distribution.unit3.actualQuantity * item.unitPrice
        distribution.ceremonyUnit.amount = distribution.ceremonyUnit.actualQuantity * item.unitPrice
        
        distributions.push(distribution)
      }
    }
    
    const savedDistributions = await LTTPDistribution.insertMany(distributions)
    console.log(`📋 Generated ${savedDistributions.length} distribution records for 7 days`)
    return savedDistributions
  } catch (error) {
    console.error('❌ Error generating distribution data:', error)
    return []
  }
}

// Main seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    await connectDB()
    await clearData()
    
    const users = await seedUsers()
    const adminUser = users[0]
    
    const units = await seedUnits()
    
    const lttpItems = await seedLTTPItems(adminUser)
    
    await generateInventoryData(lttpItems, adminUser)
    
    await generateDistributionData(lttpItems, units, adminUser)
    
    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`👥 Users: ${users.length}`)
    console.log(`🏢 Units: ${units.length}`)
    console.log(`📦 LTTP Items: ${lttpItems.length}`)
    console.log(`📊 Inventory records: ${lttpItems.length * 30} (30 days)`)
    console.log(`📋 Distribution records: ~${Math.ceil(lttpItems.length / 3) * 7} (7 days)`)
    
    console.log('\n🔐 Login credentials:')
    console.log('Admin: admin@military.gov.vn / admin123')
    console.log('Manager: manager@military.gov.vn / admin123')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await mongoose.connection.close()
    console.log('📴 Database connection closed')
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
}

module.exports = {
  seedDatabase,
  lttpItemsData,
  unitsData,
  usersData
} 