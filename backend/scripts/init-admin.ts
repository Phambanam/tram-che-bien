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

    // Clear existing users and units
    await db.collection("users").deleteMany({})
    await db.collection("units").deleteMany({})
    console.log("Existing users and units cleared")

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