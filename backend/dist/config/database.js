"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.getMongoose = exports.closeConnection = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
const MONGODB_URI = process.env.MONGODB_URI;
// Connection options
const options = {
// No need for serverApi with mongoose
// Mongoose will handle the connection pool
};
// Global promise of the mongoose connection
let mongoosePromise = null;
// Connect to MongoDB with Mongoose
const connectToDatabase = async () => {
    try {
        // If we already have a connection promise, reuse it
        if (mongoosePromise) {
            console.log('Reusing existing MongoDB connection');
            return await mongoosePromise;
        }
        // Create a new connection
        console.log('Creating new MongoDB connection');
        // Create promise
        mongoosePromise = mongoose_1.default.connect(MONGODB_URI, options);
        // Add connection event handlers
        mongoose_1.default.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            // Reset promise on error
            mongoosePromise = null;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            // Reset promise when disconnected
            mongoosePromise = null;
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });
        // Wait for connection to be established
        await mongoosePromise;
        return mongoose_1.default;
    }
    catch (error) {
        console.error('Database connection error:', error);
        // Reset promise if connection fails
        mongoosePromise = null;
        throw new Error(`Unable to connect to database: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.connectToDatabase = connectToDatabase;
// Function to close connection when needed
const closeConnection = async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
        mongoosePromise = null;
    }
};
exports.closeConnection = closeConnection;
// Function to get the mongoose instance
const getMongoose = async () => {
    return await (0, exports.connectToDatabase)();
};
exports.getMongoose = getMongoose;
// For backward compatibility with existing code
const getDb = async () => {
    await (0, exports.connectToDatabase)();
    return mongoose_1.default.connection.db;
};
exports.getDb = getDb;
