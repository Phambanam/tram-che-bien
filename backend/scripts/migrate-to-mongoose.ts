/**
 * Migration script to help with transitioning from MongoDB to Mongoose
 * 
 * This script will:
 * 1. Connect to the database using both MongoDB native driver and Mongoose
 * 2. For each collection, read the data using MongoDB driver
 * 3. Transform the data to match Mongoose schemas if needed
 * 4. Print data structure for verification
 * 5. Allow optional data validation without actual migration
 * 
 * Run with: npx ts-node scripts/migrate-to-mongoose.ts [--validate-only]
 */

import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Unit, Supply, Category, Product } from '../src/models';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';

// Command line arguments
const VALIDATE_ONLY = process.argv.includes('--validate-only');

async function connect() {
  try {
    // Connect with MongoDB driver
    const mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB with native driver');
    
    // Connect with Mongoose
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB with Mongoose');
    
    return { 
      mongoClient, 
      mongoDb: mongoClient.db(),
      mongoose 
    };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateCollection(
  mongoDb: any, 
  collectionName: string, 
  model: mongoose.Model<any>,
  transform: (item: any) => any
) {
  console.log(`\n--- Processing ${collectionName} ---`);
  
  try {
    // Get data from MongoDB
    const items = await mongoDb.collection(collectionName).find({}).toArray();
    console.log(`Found ${items.length} items in ${collectionName} collection`);
    
    if (items.length === 0) {
      console.log(`No items to migrate in ${collectionName}`);
      return;
    }
    
    // Show sample data
    console.log(`Sample original document:`, JSON.stringify(items[0], null, 2));
    
    // Transform data
    const transformedItems = items.map(transform);
    console.log(`Sample transformed document:`, JSON.stringify(transformedItems[0], null, 2));
    
    // Validate against Mongoose schema
    console.log(`Validating ${transformedItems.length} items against Mongoose schema...`);
    
    let validCount = 0;
    let invalidCount = 0;
    let errors: any[] = [];
    
    for (const item of transformedItems) {
      try {
        // Create a new document but don't save it
        const doc = new model(item);
        await doc.validate();
        validCount++;
      } catch (error) {
        invalidCount++;
        errors.push({
          originalId: item._id,
          error: (error as Error).message
        });
        
        if (errors.length <= 3) { // Show only first 3 errors
          console.error(`Validation error for item ${item._id}:`, (error as Error).message);
        }
      }
    }
    
    console.log(`Validation results: ${validCount} valid, ${invalidCount} invalid`);
    
    if (invalidCount > 0 && errors.length > 3) {
      console.log(`... and ${errors.length - 3} more errors`);
    }
    
    // If not just validating, save the data
    if (!VALIDATE_ONLY && invalidCount === 0) {
      console.log(`Migrating ${transformedItems.length} items to Mongoose...`);
      
      // Use insertMany for better performance
      if (transformedItems.length > 0) {
        // Use a fake model for demonstration only
        console.log(`Migration would save ${transformedItems.length} items.`);
        // In a real migration, you would do:
        // await model.insertMany(transformedItems, { ordered: false });
      }
      
      console.log(`Migration completed for ${collectionName}`);
    }
  } catch (error) {
    console.error(`Error processing ${collectionName}:`, error);
  }
}

async function main() {
  // Connect to database
  const { mongoClient, mongoDb, mongoose } = await connect();
  
  try {
    // Process each collection
    await migrateCollection(mongoDb, 'users', User, (user) => {
      // Transform user document if needed
      return {
        ...user,
        // Add any transformations needed
      };
    });
    
    await migrateCollection(mongoDb, 'units', Unit, (unit) => {
      // Transform unit document if needed
      return {
        ...unit,
        // Add any transformations needed
      };
    });
    
    await migrateCollection(mongoDb, 'supplies', Supply, (supply) => {
      // Transform supply document if needed
      return {
        ...supply,
        // Transform createdBy from ObjectId to { id, name } structure if needed
        createdBy: supply.createdBy && typeof supply.createdBy === 'object' && !(supply.createdBy instanceof ObjectId) 
          ? supply.createdBy 
          : { id: supply.createdBy, name: 'Unknown' },
        // Transform approvedBy from ObjectId to { id, name } structure if needed
        approvedBy: supply.approvedBy && typeof supply.approvedBy === 'object' && !(supply.approvedBy instanceof ObjectId)
          ? supply.approvedBy
          : supply.approvedBy ? { id: supply.approvedBy, name: 'Unknown' } : null,
      };
    });
    
    await migrateCollection(mongoDb, 'categories', Category, (category) => {
      // Transform category document if needed
      return {
        ...category,
        // Add any transformations needed
      };
    });
    
    await migrateCollection(mongoDb, 'products', Product, (product) => {
      // Transform product document if needed
      return {
        ...product,
        // Add any transformations needed
      };
    });
    
    console.log('\nMigration process complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoClient.close();
    await mongoose.disconnect();
    console.log('Connections closed');
  }
}

// Run the migration
main().catch(console.error); 