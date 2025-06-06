import { hash } from "bcryptjs"
import dotenv from "dotenv"
import { connectToDatabase, closeConnection, getDb } from "../src/config/database"

// This script seeds the database with initial data
// Run with: npx ts-node --project tsconfig.json scripts/seed.ts

// Load environment variables
dotenv.config()

async function seed() {
  console.log("Seeding database...")

  try {
    // Connect to database using Mongoose
    await connectToDatabase()
    const db = await getDb()

    if (!db) {
      throw new Error("Failed to connect to database")
    }

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("units").deleteMany({})
    await db.collection("categories").deleteMany({})
    await db.collection("products").deleteMany({})
    await db.collection("supplies").deleteMany({})

    console.log("Existing data cleared")

    // Seed units
    const units = [
      { 
        name: "Tiểu đoàn 1", 
        code: "TD1",
        description: "Tiểu đoàn 1", 
        status: "active",
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        name: "Tiểu đoàn 2", 
        code: "TD2",
        description: "Tiểu đoàn 2", 
        status: "active",
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        name: "Tiểu đoàn 3", 
        code: "TD3",
        description: "Tiểu đoàn 3", 
        status: "active",
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        name: "Lữ đoàn bộ", 
        code: "LDB",
        description: "Lữ đoàn bộ", 
        status: "active",
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
    ]

    const unitResult = await db.collection("units").insertMany(units)
    console.log(`${unitResult.insertedCount} units inserted`)

    // Seed categories
    const categories = [
      { name: "Rau", description: "Các loại rau", createdAt: new Date(), updatedAt: new Date() },
      { name: "Gia súc", description: "Các loại gia súc", createdAt: new Date(), updatedAt: new Date() },
      { name: "Gia cầm", description: "Các loại gia cầm", createdAt: new Date(), updatedAt: new Date() },
      { name: "Hải sản", description: "Các loại hải sản", createdAt: new Date(), updatedAt: new Date() },
      { name: "Gia vị", description: "Các loại gia vị", createdAt: new Date(), updatedAt: new Date() },
      { name: "Khác", description: "Các loại khác", createdAt: new Date(), updatedAt: new Date() },
    ]

    const categoryResult = await db.collection("categories").insertMany(categories)
    console.log(`${categoryResult.insertedCount} categories inserted`)

    // Seed products
    const products = [
      // Rau
      {
        name: "Rau cải",
        category: categoryResult.insertedIds[0],
        description: "Rau cải xanh",
        unit: "kg",
        standardAmount: 0.3, // 300g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rau muống",
        category: categoryResult.insertedIds[0],
        description: "Rau muống",
        unit: "kg",
        standardAmount: 0.25, // 250g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cà chua",
        category: categoryResult.insertedIds[0],
        description: "Cà chua",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dưa chuột",
        category: categoryResult.insertedIds[0],
        description: "Dưa chuột",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bắp cải",
        category: categoryResult.insertedIds[0],
        description: "Bắp cải",
        unit: "kg",
        standardAmount: 0.3, // 300g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia súc
      {
        name: "Thịt lợn",
        category: categoryResult.insertedIds[1],
        description: "Thịt lợn",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt bò",
        category: categoryResult.insertedIds[1],
        description: "Thịt bò",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt trâu",
        category: categoryResult.insertedIds[1],
        description: "Thịt trâu",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt dê",
        category: categoryResult.insertedIds[1],
        description: "Thịt dê",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt cừu",
        category: categoryResult.insertedIds[1],
        description: "Thịt cừu",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia cầm
      {
        name: "Thịt gà",
        category: categoryResult.insertedIds[2],
        description: "Thịt gà",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt vịt",
        category: categoryResult.insertedIds[2],
        description: "Thịt vịt",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt ngan",
        category: categoryResult.insertedIds[2],
        description: "Thịt ngan",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt ngỗng",
        category: categoryResult.insertedIds[2],
        description: "Thịt ngỗng",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Trứng gà",
        category: categoryResult.insertedIds[2],
        description: "Trứng gà",
        unit: "quả",
        standardAmount: 1, // 1 egg per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Hải sản
      {
        name: "Cá thu",
        category: categoryResult.insertedIds[3],
        description: "Cá thu",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cá ngừ",
        category: categoryResult.insertedIds[3],
        description: "Cá ngừ",
        unit: "kg",
        standardAmount: 0.2, // 200g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tôm",
        category: categoryResult.insertedIds[3],
        description: "Tôm",
        unit: "kg",
        standardAmount: 0.1, // 100g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mực",
        category: categoryResult.insertedIds[3],
        description: "Mực",
        unit: "kg",
        standardAmount: 0.15, // 150g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cua",
        category: categoryResult.insertedIds[3],
        description: "Cua",
        unit: "kg",
        standardAmount: 0.1, // 100g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia vị
      {
        name: "Muối",
        category: categoryResult.insertedIds[4],
        description: "Muối",
        unit: "kg",
        standardAmount: 0.01, // 10g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Đường",
        category: categoryResult.insertedIds[4],
        description: "Đường",
        unit: "kg",
        standardAmount: 0.02, // 20g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bột ngọt",
        category: categoryResult.insertedIds[4],
        description: "Bột ngọt",
        unit: "kg",
        standardAmount: 0.005, // 5g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Hạt nêm",
        category: categoryResult.insertedIds[4],
        description: "Hạt nêm",
        unit: "kg",
        standardAmount: 0.01, // 10g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tiêu",
        category: categoryResult.insertedIds[4],
        description: "Tiêu",
        unit: "kg",
        standardAmount: 0.002, // 2g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Khác
      {
        name: "Gạo",
        category: categoryResult.insertedIds[5],
        description: "Gạo",
        unit: "kg",
        standardAmount: 0.5, // 500g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mì",
        category: categoryResult.insertedIds[5],
        description: "Mì",
        unit: "kg",
        standardAmount: 0.1, // 100g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bún",
        category: categoryResult.insertedIds[5],
        description: "Bún",
        unit: "kg",
        standardAmount: 0.1, // 100g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Miến",
        category: categoryResult.insertedIds[5],
        description: "Miến",
        unit: "kg",
        standardAmount: 0.05, // 50g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Đậu phụ",
        category: categoryResult.insertedIds[5],
        description: "Đậu phụ",
        unit: "kg",
        standardAmount: 0.1, // 100g per person
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const productResult = await db.collection("products").insertMany(products)
    console.log(`${productResult.insertedCount} products inserted`)

    // Seed admin user
    const hashedPassword = await hash("admin123", 12)
    const adminUser = {
      username: "admin",
      phoneNumber: "0123456789",
      password: hashedPassword,
      fullName: "Admin",
      rank: "Thiếu tá",
      position: "Trợ lý quân nhu",
      unit: unitResult.insertedIds[3], // Lữ đoàn bộ
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const adminResult = await db.collection("users").insertOne(adminUser)
    console.log(`Admin user inserted with ID: ${adminResult.insertedId}`)

    // Seed sample users
    const sampleUsers = [
      {
        username: "tieudoan1",
        phoneNumber: "0987654321",
        password: await hash("password123", 12),
        fullName: "Nguyễn Văn A",
        rank: "Đại úy",
        position: "Trợ lý hậu cần",
        unit: unitResult.insertedIds[0], // Tiểu đoàn 1
        role: "unitAssistant",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "tieudoan2",
        phoneNumber: "0976543210",
        password: await hash("password123", 12),
        fullName: "Trần Văn B",
        rank: "Thượng úy",
        position: "Trợ lý hậu cần",
        unit: unitResult.insertedIds[1], // Tiểu đoàn 2
        role: "unitAssistant",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "ludoan",
        phoneNumber: "0965432109",
        password: await hash("password123", 12),
        fullName: "Lê Văn C",
        rank: "Thiếu tá",
        position: "Trợ lý hậu cần",
        unit: unitResult.insertedIds[3], // Lữ đoàn bộ
        role: "brigadeAssistant",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "chihuy",
        phoneNumber: "0954321098",
        password: await hash("password123", 12),
        fullName: "Phạm Văn D",
        rank: "Trung tá",
        position: "Chỉ huy",
        unit: unitResult.insertedIds[3], // Lữ đoàn bộ
        role: "commander",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userResult = await db.collection("users").insertMany(sampleUsers)
    console.log(`${userResult.insertedCount} sample users inserted`)

    // Seed sample supplies
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const supplies = [
      {
        unit: unitResult.insertedIds[0], // Tiểu đoàn 1
        category: categoryResult.insertedIds[0], // Rau
        product: productResult.insertedIds[0], // Rau cải
        supplyQuantity: 50, // Changed from quantity to supplyQuantity
        expectedHarvestDate: tomorrow, // Changed from harvestDate to expectedHarvestDate
        stationEntryDate: null,
        receivedQuantity: null,
        status: "pending",
        note: "",
        createdBy: {
          id: userResult.insertedIds[0].toString(),
          name: "Nguyễn Văn A"
        },
        approvedBy: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[1], // Tiểu đoàn 2
        category: categoryResult.insertedIds[2], // Gia cầm
        product: productResult.insertedIds[10], // Thịt gà
        supplyQuantity: 30, // Changed from quantity to supplyQuantity
        expectedHarvestDate: nextWeek, // Changed from harvestDate to expectedHarvestDate
        stationEntryDate: null,
        receivedQuantity: null,
        status: "pending",
        note: "",
        createdBy: {
          id: userResult.insertedIds[1].toString(),
          name: "Trần Văn B"
        },
        approvedBy: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[0], // Tiểu đoàn 1
        category: categoryResult.insertedIds[0], // Rau
        product: productResult.insertedIds[1], // Rau muống
        supplyQuantity: 40, // Changed from quantity to supplyQuantity
        expectedHarvestDate: yesterday, // Changed from harvestDate to expectedHarvestDate
        stationEntryDate: today.toISOString(),
        receivedQuantity: 38,
        status: "approved",
        note: "Thiếu 2kg do vận chuyển",
        createdBy: {
          id: userResult.insertedIds[0].toString(),
          name: "Nguyễn Văn A"
        },
        approvedBy: {
          id: userResult.insertedIds[2].toString(),
          name: "Lê Văn C"
        },
        createdAt: new Date(yesterday.getTime() - 86400000), // 2 days ago
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[1], // Tiểu đoàn 2
        category: categoryResult.insertedIds[1], // Gia súc
        product: productResult.insertedIds[5], // Thịt lợn
        supplyQuantity: 100, // Changed from quantity to supplyQuantity
        expectedHarvestDate: yesterday, // Changed from harvestDate to expectedHarvestDate
        stationEntryDate: today.toISOString(),
        receivedQuantity: 100,
        status: "approved",
        note: "",
        createdBy: {
          id: userResult.insertedIds[1].toString(),
          name: "Trần Văn B"
        },
        approvedBy: {
          id: userResult.insertedIds[2].toString(),
          name: "Lê Văn C"
        },
        createdAt: new Date(yesterday.getTime() - 86400000), // 2 days ago
        updatedAt: yesterday,
      },
    ]

    const supplyResult = await db.collection("supplies").insertMany(supplies)
    console.log(`${supplyResult.insertedCount} sample supplies inserted`)

    console.log("Database seeded successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await closeConnection()
  }
}

seed()
