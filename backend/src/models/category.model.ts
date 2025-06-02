import mongoose, { Schema, Document, Model } from 'mongoose';

// Base interface for category attributes (without _id)
export interface ICategoryAttributes {
  name: string;
  slug?: string; // Slug field in existing data
  description?: string;
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for category document
export interface ICategory extends ICategoryAttributes, Document<string> {
  // Using Document<string> to specify that _id is a string
}

// Interface for category model
export interface ICategoryModel extends Model<ICategory> {
  // Add any static methods here if needed
}

const CategorySchema: Schema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String }, // Slug field in existing data
  description: { type: String },
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

export const Category = mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema); 