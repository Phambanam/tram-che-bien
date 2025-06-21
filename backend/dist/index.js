"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const error_middleware_1 = require("./middleware/error.middleware");
const mobile_middleware_1 = require("./middleware/mobile.middleware");
const swagger_1 = require("./config/swagger"); // Import Swagger setup function
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const unit_routes_1 = __importDefault(require("./routes/unit.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const supply_routes_1 = __importDefault(require("./routes/supply.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const statistics_routes_1 = __importDefault(require("./routes/statistics.routes"));
const print_routes_1 = __importDefault(require("./routes/print.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
const dish_routes_1 = __importDefault(require("./routes/dish.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const processing_station_routes_1 = __importDefault(require("./routes/processing-station.routes"));
const supply_output_routes_1 = __importDefault(require("./routes/supply-output.routes"));
const daily_ration_routes_1 = __importDefault(require("./routes/daily-ration.routes"));
const menu_planning_routes_1 = __importDefault(require("./routes/menu-planning.routes"));
const unit_personnel_daily_routes_1 = __importDefault(require("./routes/unit-personnel-daily.routes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Setup Swagger API documentation
(0, swagger_1.setupSwagger)(app); // Call the function to setup Swagger
// Middleware
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5001',
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.CORS_ORIGIN
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && allowedOrigins[0] !== '*') {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(mobile_middleware_1.detectMobileClient); // Detect mobile clients
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/units", unit_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/supplies", supply_routes_1.default);
app.use("/api/reports", report_routes_1.default);
// New routes
app.use("/api/statistics", statistics_routes_1.default);
app.use("/api/print", print_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/roles", role_routes_1.default);
app.use("/api/content", content_routes_1.default);
app.use("/api/dishes", dish_routes_1.default);
app.use("/api/menus", menu_routes_1.default);
app.use("/api/processing-station", processing_station_routes_1.default);
app.use("/api/supply-outputs", supply_output_routes_1.default);
app.use("/api/daily-rations", daily_ration_routes_1.default);
app.use("/api/menu-planning", menu_planning_routes_1.default);
app.use("/api/unit-personnel-daily", unit_personnel_daily_routes_1.default);
// routes
app.use("/api/upload", upload_routes_1.default);
// static files
app.use("/uploads", express_1.default.static("uploads"));
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectToDatabase)();
        console.log("Connected to MongoDB");
        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
