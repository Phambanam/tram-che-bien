import mongoose, { Schema, Document, Model } from 'mongoose';

// Base interface for unit attributes
export interface IUnitAttributes {
  name: string;
  code: string;
  personnel?: number;
  commander?: string | mongoose.Types.ObjectId; // Can be either string or ObjectId
  contact?: string;
  description?: string;
  parentUnit?: mongoose.Types.ObjectId;
  assistant?: mongoose.Types.ObjectId;
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for unit document (combines base interface with Document)
export interface IUnit extends IUnitAttributes, Document {
  // Add any document methods here if needed
}

// Interface for unit model
export interface IUnitModel extends Model<IUnit> {
  // Add any static methods here if needed
}

const UnitSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  personnel: { type: Number },
  commander: { 
    type: Schema.Types.Mixed, // Can be either String or ObjectId
    required: false 
  },
  contact: { type: String },
  description: { type: String },
  parentUnit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  assistant: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add any middleware or methods here

export const Unit = mongoose.model<IUnit, IUnitModel>('Unit', UnitSchema); 