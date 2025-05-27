import { MongoClient, ServerApiVersion } from "mongodb"

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

// Biến toàn cục để lưu trữ kết nối
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function connectToDatabase() {
  try {
    // Nếu đã có kết nối, kiểm tra xem nó có hoạt động không
    if (client && client.topology?.isConnected()) {
      console.log("Reusing existing MongoDB connection")
      return client
    }

    // Nếu đang có promise kết nối, sử dụng lại
    if (clientPromise) {
      console.log("Waiting for existing connection promise")
      client = await clientPromise
      return client
    }

    // Tạo client mới và kết nối
    console.log("Creating new MongoDB connection")
    client = new MongoClient(uri, options)
    clientPromise = client.connect()

    client = await clientPromise

    // Kiểm tra kết nối bằng cách ping
    await client.db("admin").command({ ping: 1 })
    console.log("MongoDB connected successfully")

    return client
  } catch (error) {
    console.error("Database connection error:", error)
    // Reset biến toàn cục nếu kết nối thất bại
    client = null
    clientPromise = null
    throw new Error(`Unable to connect to database: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Hàm đóng kết nối khi cần thiết (ví dụ: khi shutdown server)
export async function closeConnection() {
  if (client) {
    await client.close()
    client = null
    clientPromise = null
    console.log("MongoDB connection closed")
  }
}
