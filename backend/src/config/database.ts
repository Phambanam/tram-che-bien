import { MongoClient, ServerApiVersion } from "mongodb"
import dotenv from "dotenv"
// Load environment variables
dotenv.config()
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}


const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

// Global variable to store the connection
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function connectToDatabase() {
  try {
    // If we already have a connection, reuse it
    if (client) {
      // Check if the client is connected by attempting a simple command
      try {
        await client.db("admin").command({ ping: 1 })
        console.log("Reusing existing MongoDB connection")
        return client
      } catch (error) {
        console.log("Existing connection is no longer valid, creating a new one")
        // Connection is not valid, continue to create a new one
      }
    }

    // If we have a connection promise, reuse it
    if (clientPromise) {
      console.log("Waiting for existing connection promise")
      client = await clientPromise
      return client
    }

    // Create a new client and connect
    console.log("Creating new MongoDB connection")
    client = new MongoClient(uri, options)
    clientPromise = client.connect()

    client = await clientPromise

    // Verify connection by pinging
    await client.db("admin").command({ ping: 1 })
    console.log("MongoDB connected successfully")

    return client
  } catch (error) {
    console.error("Database connection error:", error)
    // Reset global variables if connection fails
    client = null
    clientPromise = null
    throw new Error(`Unable to connect to database: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to close connection when needed (e.g., when shutting down server)
export async function closeConnection() {
  if (client) {
    await client.close()
    client = null
    clientPromise = null
    console.log("MongoDB connection closed")
  }
}

// Function to get database instance
export async function getDb(dbName?: string) {
  const conn = await connectToDatabase()
  return conn.db(dbName)
}
