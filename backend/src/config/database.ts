import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

// Connection options
const options: mongoose.ConnectOptions = {
  // No need for serverApi with mongoose
  // Mongoose will handle the connection pool
};

// Global promise of the mongoose connection
let mongoosePromise: Promise<typeof mongoose> | null = null;

// Connect to MongoDB with Mongoose
export const connectToDatabase = async (): Promise<typeof mongoose> => {
  try {
    // If we already have a connection promise, reuse it
    if (mongoosePromise) {
      console.log('Reusing existing MongoDB connection');
      return await mongoosePromise;
    }

    // Create a new connection
    console.log('Creating new MongoDB connection');
    
    // Create promise
    mongoosePromise = mongoose.connect(MONGODB_URI, options);

    // Add connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Reset promise on error
      mongoosePromise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      // Reset promise when disconnected
      mongoosePromise = null;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    // Wait for connection to be established
    await mongoosePromise;
    return mongoose;
  } catch (error) {
    console.error('Database connection error:', error);
    // Reset promise if connection fails
    mongoosePromise = null;
    throw new Error(`Unable to connect to database: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to close connection when needed
export const closeConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    mongoosePromise = null;
  }
};

// Function to get the mongoose instance
export const getMongoose = async (): Promise<typeof mongoose> => {
  return await connectToDatabase();
};

// For backward compatibility with existing code
export const getDb = async () => {
  await connectToDatabase();
  return mongoose.connection.db;
};
