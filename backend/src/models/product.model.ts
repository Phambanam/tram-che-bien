import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: string; // Custom string ID like "gao"
  name: string;
  unit: string;
  category: string; // Reference to Category by string ID
  standardAmount: number;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
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

export const Product = mongoose.model<IProduct>('Product', ProductSchema); 