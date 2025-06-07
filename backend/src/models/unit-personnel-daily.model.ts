import mongoose, { Schema, Document, Model } from 'mongoose';

// Base interface for unit daily personnel attributes
export interface IUnitPersonnelDailyAttributes {
  unitId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  personnel: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for unit daily personnel document
export interface IUnitPersonnelDaily extends IUnitPersonnelDailyAttributes, Document {
  // Add any document methods here if needed
}

// Interface for unit daily personnel model
export interface IUnitPersonnelDailyModel extends Model<IUnitPersonnelDaily> {
  // Add any static methods here if needed
}

const UnitPersonnelDailySchema: Schema = new Schema({
  unitId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Unit',
    required: true 
  },
  date: { 
    type: String, 
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format
  },
  personnel: { 
    type: Number, 
    required: true,
    min: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create compound index for efficient queries
UnitPersonnelDailySchema.index({ unitId: 1, date: 1 }, { unique: true });

export const UnitPersonnelDaily = mongoose.model<IUnitPersonnelDaily, IUnitPersonnelDailyModel>('UnitPersonnelDaily', UnitPersonnelDailySchema); 