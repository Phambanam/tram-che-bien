import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
  name: string;
  code: string;
  parentUnit?: mongoose.Types.ObjectId;
  commander?: mongoose.Types.ObjectId;
  assistant?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  parentUnit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  commander: { type: Schema.Types.ObjectId, ref: 'User' },
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

export const Unit = mongoose.model<IUnit>('Unit', UnitSchema); 