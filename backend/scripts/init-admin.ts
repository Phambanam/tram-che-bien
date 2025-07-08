import { hash } from "bcryptjs"
import dotenv from "dotenv"
import { connectToDatabase, closeConnection, getDb } from "../src/config/database"

// This script initializes only the admin account
// Run with: npx ts-node --project tsconfig.json scripts/init-admin.ts

// Load environment variables
dotenv.config()

async function initAdmin() {
  console.log("Initializing admin account...")

  try {
    // Connect to database using Mongoose
    await connectToDatabase()
    const db = await getDb()

    if (!db) {
      throw new Error("Failed to connect to database")
    }

    // Clear existing users
    await db.collection("users").deleteMany({})
    console.log("Existing users cleared")

    // Create admin user
    const hashedPassword = await hash("admin123", 12)
    const adminUser = {
      username: "admin",
      phoneNumber: "0123456789",
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
    console.log("  Password: admin123")
    console.log("  Role: admin")

  } catch (error) {
    console.error("Error initializing admin account:", error)
  } finally {
    await closeConnection()
  }
}

initAdmin() 