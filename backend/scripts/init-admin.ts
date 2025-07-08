import { hash } from "bcryptjs"
import dotenv from "dotenv"
import { connectToDatabase, closeConnection, getDb } from "../src/config/database"

// This script initializes units and admin account
// Run with: npx ts-node --project tsconfig.json scripts/init-admin.ts

// Load environment variables
dotenv.config()

async function initAdmin() {
  console.log("Initializing units and admin account...")

  try {
    // Connect to database using Mongoose
    await connectToDatabase()
    const db = await getDb()

    if (!db) {
      throw new Error("Failed to connect to database")
    }

    // Clear existing users, units, categories, and products
    await db.collection("users").deleteMany({})
    await db.collection("units").deleteMany({})
    await db.collection("categories").deleteMany({})
    await db.collection("products").deleteMany({})
    console.log("Existing users, units, categories, and products cleared")

    // Create units first
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

    const unitsResult = await db.collection("units").insertMany(units)
    console.log(`${unitsResult.insertedCount} units created successfully`)

    // Create food categories
    const categories = [
      { code: "luong-thuc", name: "Lương thực", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-gia-suc", name: "Thịt gia súc", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-gia-cam", name: "Thịt gia cầm", createdAt: new Date(), updatedAt: new Date() },
      { code: "hai-san", name: "Hải sản", createdAt: new Date(), updatedAt: new Date() },
      { code: "trung", name: "Trứng", createdAt: new Date(), updatedAt: new Date() },
      { code: "cac-loai-hat", name: "Các loại hạt", createdAt: new Date(), updatedAt: new Date() },
      { code: "rau-cu-qua", name: "Rau củ quả", createdAt: new Date(), updatedAt: new Date() },
      { code: "sua-tuoi", name: "Sữa tươi", createdAt: new Date(), updatedAt: new Date() },
      { code: "trai-cay", name: "Trái cây", createdAt: new Date(), updatedAt: new Date() },
      { code: "gia-vi", name: "Gia vị", createdAt: new Date(), updatedAt: new Date() },
      { code: "ve-sinh-dccd", name: "Vệ sinh DCCD", createdAt: new Date(), updatedAt: new Date() },
      { code: "chat-dot", name: "Chất đốt", createdAt: new Date(), updatedAt: new Date() },
    ]

    const categoriesResult = await db.collection("categories").insertMany(categories)
    console.log(`${categoriesResult.insertedCount} categories created successfully`)

    // Create food products
    const products = [
      // Lương thực
      { code: "gao", name: "Gạo", unit: "kg", category: "luong-thuc", createdAt: new Date(), updatedAt: new Date() },
      { code: "bun", name: "Bún", unit: "kg", category: "luong-thuc", createdAt: new Date(), updatedAt: new Date() },
      { code: "mien", name: "Miến", unit: "kg", category: "luong-thuc", createdAt: new Date(), updatedAt: new Date() },
      { code: "banh-mi", name: "Bánh mì", unit: "ổ", category: "luong-thuc", createdAt: new Date(), updatedAt: new Date() },
      
      // Thịt gia súc
      { code: "thit-lon", name: "Thịt lợn", unit: "kg", category: "thit-gia-suc", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-bo", name: "Thịt bò", unit: "kg", category: "thit-gia-suc", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-trau", name: "Thịt trâu", unit: "kg", category: "thit-gia-suc", createdAt: new Date(), updatedAt: new Date() },
      
      // Thịt gia cầm
      { code: "thit-ga", name: "Thịt gà", unit: "kg", category: "thit-gia-cam", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-vit", name: "Thịt vịt", unit: "kg", category: "thit-gia-cam", createdAt: new Date(), updatedAt: new Date() },
      { code: "thit-ngan", name: "Thịt ngan", unit: "kg", category: "thit-gia-cam", createdAt: new Date(), updatedAt: new Date() },
      
      // Hải sản
      { code: "ca", name: "Cá", unit: "kg", category: "hai-san", createdAt: new Date(), updatedAt: new Date() },
      { code: "tom", name: "Tôm", unit: "kg", category: "hai-san", createdAt: new Date(), updatedAt: new Date() },
      { code: "muc", name: "Mực", unit: "kg", category: "hai-san", createdAt: new Date(), updatedAt: new Date() },
      
      // Trứng
      { code: "trung-ga", name: "Trứng gà", unit: "quả", category: "trung", createdAt: new Date(), updatedAt: new Date() },
      { code: "trung-vit", name: "Trứng vịt", unit: "quả", category: "trung", createdAt: new Date(), updatedAt: new Date() },
      
      // Các loại hạt
      { code: "dau-nanh", name: "Đậu nành", unit: "kg", category: "cac-loai-hat", createdAt: new Date(), updatedAt: new Date() },
      { code: "dau-xanh", name: "Đậu xanh", unit: "kg", category: "cac-loai-hat", createdAt: new Date(), updatedAt: new Date() },
      { code: "lac", name: "Lạc", unit: "kg", category: "cac-loai-hat", createdAt: new Date(), updatedAt: new Date() },
      
      // Rau củ quả
      { code: "rau-muong", name: "Rau muống", unit: "kg", category: "rau-cu-qua", createdAt: new Date(), updatedAt: new Date() },
      { code: "rau-cai", name: "Rau cải", unit: "kg", category: "rau-cu-qua", createdAt: new Date(), updatedAt: new Date() },
      { code: "ca-rot", name: "Cà rốt", unit: "kg", category: "rau-cu-qua", createdAt: new Date(), updatedAt: new Date() },
      { code: "khoai-tay", name: "Khoai tây", unit: "kg", category: "rau-cu-qua", createdAt: new Date(), updatedAt: new Date() },
      
      // Sữa tươi
      { code: "sua-tuoi", name: "Sữa tươi", unit: "lít", category: "sua-tuoi", createdAt: new Date(), updatedAt: new Date() },
      
      // Trái cây
      { code: "chuoi", name: "Chuối", unit: "kg", category: "trai-cay", createdAt: new Date(), updatedAt: new Date() },
      { code: "cam", name: "Cam", unit: "kg", category: "trai-cay", createdAt: new Date(), updatedAt: new Date() },
      { code: "dua-hau", name: "Dưa hấu", unit: "kg", category: "trai-cay", createdAt: new Date(), updatedAt: new Date() },
      
      // Gia vị
      { code: "muoi", name: "Muối", unit: "kg", category: "gia-vi", createdAt: new Date(), updatedAt: new Date() },
      { code: "duong", name: "Đường", unit: "kg", category: "gia-vi", createdAt: new Date(), updatedAt: new Date() },
      { code: "nuoc-mam", name: "Nước mắm", unit: "lít", category: "gia-vi", createdAt: new Date(), updatedAt: new Date() },
      { code: "dau-an", name: "Dầu ăn", unit: "lít", category: "gia-vi", createdAt: new Date(), updatedAt: new Date() },
      
      // Vệ sinh DCCD
      { code: "nuoc-rua-bat", name: "Nước rửa bát", unit: "chai", category: "ve-sinh-dccd", createdAt: new Date(), updatedAt: new Date() },
      
      // Chất đốt
      { code: "gas", name: "Gas", unit: "bình", category: "chat-dot", createdAt: new Date(), updatedAt: new Date() },
      { code: "than", name: "Than", unit: "kg", category: "chat-dot", createdAt: new Date(), updatedAt: new Date() },
    ]

    const productsResult = await db.collection("products").insertMany(products)
    console.log(`${productsResult.insertedCount} products created successfully`)

    // Create admin user
    const hashedPassword = await hash("admin123", 12)
    const adminUser = {
      username: "admin",
      phoneNumber: "0862852954",
      password: hashedPassword,
      fullName: "Administrator",
      rank: "Thiếu tá",
      position: "Quản trị viên hệ thống",
      unit: null, // Admin không thuộc đơn vị cụ thể
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const adminResult = await db.collection("users").insertOne(adminUser)
    console.log(`Admin user created successfully with ID: ${adminResult.insertedId}`)
    console.log("Admin credentials:")
    console.log("  Username: admin")
    console.log("  Phone: 0862852954")
    console.log("  Password: admin123")
    console.log("  Role: admin")
    console.log("\nAvailable units for other users:")
    units.forEach(unit => console.log(`  - ${unit.name} (${unit.code})`))

  } catch (error) {
    console.error("Error initializing admin account:", error)
  } finally {
    await closeConnection()
  }
}

initAdmin() 