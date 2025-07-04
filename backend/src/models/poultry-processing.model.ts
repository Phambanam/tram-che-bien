import mongoose, { Schema, Document, Model } from 'mongoose';

// Base interface for poultry processing
export interface IPoultryProcessingAttributes {
  date: string; // Format: YYYY-MM-DD
  livePoultryInput: number; // Số kg gia cầm sống nhập vào
  poultryMeatOutput: number; // Số kg thịt gia cầm thu được
  poultryMeatActualOutput: number; // Số kg thịt gia cầm đã xuất
  livePoultryPrice: number; // Giá gia cầm sống (VND/kg)
  poultryMeatPrice: number; // Giá thịt gia cầm (VND/kg) 
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for poultry processing document
export interface IPoultryProcessing extends IPoultryProcessingAttributes, Document {}

// Interface for poultry processing model
export interface IPoultryProcessingModel extends Model<IPoultryProcessing> {}

const PoultryProcessingSchema: Schema = new Schema({
  date: { 
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format
  },
  livePoultryInput: {
    type: Number,
    required: true,
    min: 0
  },
  poultryMeatOutput: {
    type: Number,
    required: true,
    min: 0
  },
  poultryMeatActualOutput: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  livePoultryPrice: {
    type: Number,
    required: true,
    default: 60000,
    min: 0
  },
  poultryMeatPrice: {
    type: Number,
    required: true, 
    default: 150000,
    min: 0
  },
  note: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
PoultryProcessingSchema.index({ date: 1 }, { unique: true });

export const PoultryProcessing = mongoose.model<IPoultryProcessing, IPoultryProcessingModel>(
  'PoultryProcessing', 
  PoultryProcessingSchema
);