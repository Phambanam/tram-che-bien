import mongoose, { Schema, Document, Model } from 'mongoose';

// Base interface for product attributes (without _id)
export interface IProductAttributes {
  name: string;
  unit: string;
  category: string; // Reference to Category by string ID
  standardAmount: number;
  description?: string;
  nutritionalValue?: string; // Additional field in existing data
  storageCondition?: string; // Additional field in existing data
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for product document
export interface IProduct extends IProductAttributes, Document<string> {
  // Using Document<string> to specify that _id is a string
}

// Interface for product model
export interface IProductModel extends Model<IProduct> {
  // Add any static methods here if needed
}

const ProductSchema: Schema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  category: { 
    type: String, 
    ref: 'Category',
    required: true 
  },
  standardAmount: { 
    type: Number, 
    default: 0 
  },
  description: { type: String },
  nutritionalValue: { type: String }, // Additional field in existing data
  storageCondition: { type: String }, // Additional field in existing data
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  _id: false // Use the _id field we provide
});

// Add any middleware or methods here

export const Product = mongoose.model<IProduct, IProductModel>('Product', ProductSchema); 