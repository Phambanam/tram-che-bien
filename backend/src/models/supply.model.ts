import mongoose, { Schema, Document } from 'mongoose';

// Define a type for the creator/approver reference
interface IUserReference {
  id: mongoose.Types.ObjectId;
  name: string;
}

// Define the Supply schema interface
export interface ISupply extends Document {
  unit: mongoose.Types.ObjectId;
  category: string;
  product: string;
  supplyQuantity: number;
  expectedHarvestDate: Date;
  stationEntryDate?: Date;
  requestedQuantity?: number;
  actualQuantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  expiryDate?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  note?: string;
  createdBy?: IUserReference;
  approvedBy?: IUserReference;
  createdAt: Date;
  updatedAt: Date;
}

const SupplySchema: Schema = new Schema({
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  category: {
    type: String,
    ref: 'Category',
    required: true
  },
  product: {
    type: String,
    ref: 'Product',
    required: true
  },
  supplyQuantity: {
    type: Number,
    required: true
  },
  expectedHarvestDate: {
    type: Date,
    required: true
  },
  stationEntryDate: {
    type: Date,
    default: null
  },
  requestedQuantity: {
    type: Number,
    default: null
  },
  actualQuantity: {
    type: Number,
    default: null
  },
  unitPrice: {
    type: Number,
    default: null
  },
  totalPrice: {
    type: Number,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'deleted'],
    default: 'pending'
  },
  note: {
    type: String,
    default: ''
  },
  createdBy: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  },
  approvedBy: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }
}, {
  timestamps: true
});

// Create and export the model
export const Supply = mongoose.model<ISupply>('Supply', SupplySchema); 