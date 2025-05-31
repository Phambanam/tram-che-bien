import { MongoClient } from "mongodb"
import { hash } from "bcryptjs"

// This script seeds the database with initial data
// Run with: npx ts-node --project tsconfig.json scripts/seed.ts

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/military-logistics"

async function seed() {
  console.log("Seeding database...")

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db()

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("units").deleteMany({})
    await db.collection("categories").deleteMany({})
    await db.collection("products").deleteMany({})
    await db.collection("supplies").deleteMany({})

    console.log("Existing data cleared")

    // Seed units
    const units = [
      { name: "Tiểu đoàn 1", description: "Tiểu đoàn 1", createdAt: new Date(), updatedAt: new Date() },
      { name: "Tiểu đoàn 2", description: "Tiểu đoàn 2", createdAt: new Date(), updatedAt: new Date() },
      { name: "Tiểu đoàn 3", description: "Tiểu đoàn 3", createdAt: new Date(), updatedAt: new Date() },
      { name: "Lữ đoàn bộ", description: "Lữ đoàn bộ", createdAt: new Date(), updatedAt: new Date() },
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rau muống",
        category: categoryResult.insertedIds[0],
        description: "Rau muống",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cà chua",
        category: categoryResult.insertedIds[0],
        description: "Cà chua",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dưa chuột",
        category: categoryResult.insertedIds[0],
        description: "Dưa chuột",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bắp cải",
        category: categoryResult.insertedIds[0],
        description: "Bắp cải",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia súc
      {
        name: "Thịt lợn",
        category: categoryResult.insertedIds[1],
        description: "Thịt lợn",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt bò",
        category: categoryResult.insertedIds[1],
        description: "Thịt bò",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt trâu",
        category: categoryResult.insertedIds[1],
        description: "Thịt trâu",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt dê",
        category: categoryResult.insertedIds[1],
        description: "Thịt dê",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt cừu",
        category: categoryResult.insertedIds[1],
        description: "Thịt cừu",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia cầm
      {
        name: "Thịt gà",
        category: categoryResult.insertedIds[2],
        description: "Thịt gà",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt vịt",
        category: categoryResult.insertedIds[2],
        description: "Thịt vịt",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt ngan",
        category: categoryResult.insertedIds[2],
        description: "Thịt ngan",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Thịt ngỗng",
        category: categoryResult.insertedIds[2],
        description: "Thịt ngỗng",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Trứng gà",
        category: categoryResult.insertedIds[2],
        description: "Trứng gà",
        unit: "quả",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Hải sản
      {
        name: "Cá thu",
        category: categoryResult.insertedIds[3],
        description: "Cá thu",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cá ngừ",
        category: categoryResult.insertedIds[3],
        description: "Cá ngừ",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tôm",
        category: categoryResult.insertedIds[3],
        description: "Tôm",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mực",
        category: categoryResult.insertedIds[3],
        description: "Mực",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cua",
        category: categoryResult.insertedIds[3],
        description: "Cua",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Gia vị
      {
        name: "Muối",
        category: categoryResult.insertedIds[4],
        description: "Muối",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Đường",
        category: categoryResult.insertedIds[4],
        description: "Đường",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bột ngọt",
        category: categoryResult.insertedIds[4],
        description: "Bột ngọt",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Hạt nêm",
        category: categoryResult.insertedIds[4],
        description: "Hạt nêm",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tiêu",
        category: categoryResult.insertedIds[4],
        description: "Tiêu",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Khác
      {
        name: "Gạo",
        category: categoryResult.insertedIds[5],
        description: "Gạo",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mì",
        category: categoryResult.insertedIds[5],
        description: "Mì",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bún",
        category: categoryResult.insertedIds[5],
        description: "Bún",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Miến",
        category: categoryResult.insertedIds[5],
        description: "Miến",
        unit: "kg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Đậu phụ",
        category: categoryResult.insertedIds[5],
        description: "Đậu phụ",
        unit: "kg",
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
        quantity: 50,
        harvestDate: tomorrow,
        stationEntryDate: null,
        receivedQuantity: null,
        status: "pending",
        note: "",
        createdBy: userResult.insertedIds[0], // tieudoan1
        approvedBy: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[1], // Tiểu đoàn 2
        category: categoryResult.insertedIds[2], // Gia cầm
        product: productResult.insertedIds[10], // Thịt gà
        quantity: 30,
        harvestDate: nextWeek,
        stationEntryDate: null,
        receivedQuantity: null,
        status: "pending",
        note: "",
        createdBy: userResult.insertedIds[1], // tieudoan2
        approvedBy: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[0], // Tiểu đoàn 1
        category: categoryResult.insertedIds[0], // Rau
        product: productResult.insertedIds[1], // Rau muống
        quantity: 40,
        harvestDate: yesterday,
        stationEntryDate: today,
        receivedQuantity: 38,
        status: "approved",
        note: "Thiếu 2kg do vận chuyển",
        createdBy: userResult.insertedIds[0], // tieudoan1
        approvedBy: userResult.insertedIds[2], // ludoan
        createdAt: new Date(yesterday.getTime() - 86400000), // 2 days ago
        updatedAt: yesterday,
      },
      {
        unit: unitResult.insertedIds[1], // Tiểu đoàn 2
        category: categoryResult.insertedIds[1], // Gia súc
        product: productResult.insertedIds[5], // Thịt lợn
        quantity: 100,
        harvestDate: yesterday,
        stationEntryDate: today,
        receivedQuantity: 100,
        status: "approved",
        note: "",
        createdBy: userResult.insertedIds[1], // tieudoan2
        approvedBy: userResult.insertedIds[2], // ludoan
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
    await client.close()
  }
}

seed()
