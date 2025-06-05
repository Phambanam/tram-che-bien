import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { connectToDatabase } from "./config/database"
import { errorHandler } from "./middleware/error.middleware"
import { detectMobileClient } from "./middleware/mobile.middleware"
import { setupSwagger } from "./config/swagger" // Import Swagger setup function

// Import routes
import authRoutes from "./routes/auth.routes"
import uploadRoutes from "./routes/upload.routes"
import userRoutes from "./routes/user.routes"
import unitRoutes from "./routes/unit.routes"
import categoryRoutes from "./routes/category.routes"
import productRoutes from "./routes/product.routes"
import supplyRoutes from "./routes/supply.routes"
import reportRoutes from "./routes/report.routes"
import statisticsRoutes from "./routes/statistics.routes"
import printRoutes from "./routes/print.routes"
import notificationRoutes from "./routes/notification.routes"
import roleRoutes from "./routes/role.routes"
import contentRoutes from "./routes/content.routes"
import dishRoutes from "./routes/dish.routes"
import menuRoutes from "./routes/menu.routes"
import processingStationRoutes from "./routes/processing-station.routes"
import supplyOutputRoutes from "./routes/supply-output.routes"
import dailyRationRoutes from "./routes/daily-ration.routes"
import menuPlanningRoutes from "./routes/menu-planning.routes"

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5001

// Setup Swagger API documentation
setupSwagger(app) // Call the function to setup Swagger

// Middleware
app.use(
  cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:5001',
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.CORS_ORIGIN];
      // Allow requests with no origin (like mobile apps or curl requests)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1 && allowedOrigins[0] !== '*') {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(detectMobileClient) // Detect mobile clients

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/units", unitRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/products", productRoutes)
app.use("/api/supplies", supplyRoutes)
app.use("/api/reports", reportRoutes)

// New routes
app.use("/api/statistics", statisticsRoutes)
app.use("/api/print", printRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/roles", roleRoutes)
app.use("/api/content", contentRoutes)
app.use("/api/dishes", dishRoutes)
app.use("/api/menus", menuRoutes)
app.use("/api/processing-station", processingStationRoutes)
app.use("/api/supply-outputs", supplyOutputRoutes)
app.use("/api/daily-rations", dailyRationRoutes)
app.use("/api/menu-planning", menuPlanningRoutes)
// routes
app.use("/api/upload", uploadRoutes)

// static files
app.use("/uploads", express.static("uploads"))
// Error handling middleware
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase()
    console.log("Connected to MongoDB")

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
