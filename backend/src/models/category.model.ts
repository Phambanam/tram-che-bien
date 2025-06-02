import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: string; // Custom string ID like "luong-thuc"
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
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

export const Category = mongoose.model<ICategory>('Category', CategorySchema); 