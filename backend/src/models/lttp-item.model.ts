import mongoose from 'mongoose'

const lttpItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Thực phẩm', 'Rau củ quả', 'Gia vị', 'Chất đốt', 'Dụng cụ', 'Khác']
  },
  unit: {
    type: String,
    required: true,
    enum: ['Kg', 'Lít', 'Gói', 'Hộp', 'Chai', 'Thùng', 'Cái']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  nutritionalInfo: {
    calories: { type: Number, default: 0 }, // kcal/100g
    protein: { type: Number, default: 0 }, // g/100g
    fat: { type: Number, default: 0 }, // g/100g
    carbs: { type: Number, default: 0 }, // g/100g
    fiber: { type: Number, default: 0 }, // g/100g
  },
  storageRequirements: {
    temperature: { type: String, enum: ['Thường', 'Mát', 'Lạnh', 'Đông'] },
    humidity: { type: String, enum: ['Khô', 'Bình thường', 'Ẩm'] },
    shelfLife: { type: Number }, // days
  },
  supplier: {
    name: { type: String },
    contact: { type: String },
    address: { type: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedPrice: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
lttpItemSchema.index({ name: 1, category: 1 })
lttpItemSchema.index({ category: 1 })
lttpItemSchema.index({ isActive: 1 })

// Virtual for formatted price
lttpItemSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(this.unitPrice)
})

export const LTTPItem = mongoose.model('LTTPItem', lttpItemSchema) 