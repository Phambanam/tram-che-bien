import mongoose from 'mongoose'

// Tofu Processing
const tofuProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  // Input materials
  input: {
    soybeans: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      supplier: { type: String },
      price: { type: Number },
      carryOverFromPreviousDay: { type: Number, default: 0 }
    },
    water: { type: Number }, // liters
    coagulant: { type: Number }, // grams
    otherIngredients: [{
      name: { type: String },
      quantity: { type: Number },
      unit: { type: String }
    }]
  },
  
  // Output products
  output: {
    tofu: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 35000 }
    },
    whey: { type: Number }, // liters (byproduct)
    waste: { type: Number } // kg
  },
  
  // Remaining/Stock
  remaining: {
    soybeans: { type: Number, default: 0 },
    tofu: { type: Number, default: 0 }
  },
  
  // Financial calculations
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 } // percentage
  },
  
  // Processing details
  processing: {
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // minutes
    temperature: { type: Number }, // celsius
    yield: { type: Number }, // percentage
    qualityNotes: { type: String },
    issues: [{ type: String }]
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Salt Processing  
const saltProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  input: {
    cabbage: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      price: { type: Number },
      carryOverFromPreviousDay: { type: Number, default: 0 }
    },
    salt: { type: Number }, // kg
    spices: [{
      name: { type: String },
      quantity: { type: Number },
      unit: { type: String }
    }]
  },
  
  output: {
    pickledCabbage: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 15000 }
    },
    brine: { type: Number }, // liters
    waste: { type: Number } // kg
  },
  
  remaining: {
    cabbage: { type: Number, default: 0 },
    pickledCabbage: { type: Number, default: 0 }
  },
  
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  
  processing: {
    saltingTime: { type: Number }, // hours
    fermentationTime: { type: Number }, // hours
    pressTime: { type: Number }, // hours
    yield: { type: Number }, // percentage
    qualityNotes: { type: String }
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Bean Sprouts Processing
const beanSproutsProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  input: {
    soybeans: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      price: { type: Number },
      carryOverFromPreviousDay: { type: Number, default: 0 }
    },
    water: { type: Number } // liters
  },
  
  output: {
    beanSprouts: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 20000 }
    },
    hulls: { type: Number }, // kg (byproduct)
    waste: { type: Number } // kg
  },
  
  remaining: {
    soybeans: { type: Number, default: 0 },
    beanSprouts: { type: Number, default: 0 }
  },
  
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  
  processing: {
    soakingTime: { type: Number }, // hours
    sproutingTime: { type: Number }, // hours
    temperature: { type: Number }, // celsius
    humidity: { type: Number }, // percentage
    yield: { type: Number }, // percentage
    qualityNotes: { type: String }
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Sausage Processing
const sausageProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  input: {
    porkMeat: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      price: { type: Number },
      carryOverFromPreviousDay: { type: Number, default: 0 }
    },
    spices: [{
      name: { type: String },
      quantity: { type: Number },
      unit: { type: String },
      price: { type: Number }
    }],
    casings: { type: Number }, // pieces
    otherIngredients: [{
      name: { type: String },
      quantity: { type: Number },
      unit: { type: String }
    }]
  },
  
  output: {
    sausages: {
      quantity: { type: Number, required: true }, // kg
      pieces: { type: Number }, // number of sausages
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 180000 }
    },
    trimming: { type: Number }, // kg (byproduct)
    waste: { type: Number } // kg
  },
  
  remaining: {
    porkMeat: { type: Number, default: 0 },
    sausages: { type: Number, default: 0 }
  },
  
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  
  processing: {
    grindingTime: { type: Number }, // minutes
    mixingTime: { type: Number }, // minutes
    stuffingTime: { type: Number }, // minutes
    cookingTime: { type: Number }, // minutes
    cookingTemperature: { type: Number }, // celsius
    yield: { type: Number }, // percentage
    qualityNotes: { type: String }
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Livestock Processing
const livestockProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  input: {
    livePigs: {
      quantity: { type: Number, required: true }, // kg live weight
      count: { type: Number }, // number of pigs
      avgWeight: { type: Number }, // kg per pig
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      price: { type: Number }, // per kg live weight
      carryOverFromPreviousDay: { type: Number, default: 0 }
    }
  },
  
  output: {
    leanMeat: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 200000 }
    },
    bones: {
      quantity: { type: Number, required: true }, // kg
      pricePerKg: { type: Number, default: 30000 }
    },
    groundMeat: {
      quantity: { type: Number, required: true }, // kg
      pricePerKg: { type: Number, default: 150000 }
    },
    organs: {
      quantity: { type: Number, required: true }, // kg
      pricePerKg: { type: Number, default: 80000 }
    },
    fat: { type: Number }, // kg
    hide: { type: Number }, // kg
    waste: { type: Number } // kg
  },
  
  remaining: {
    livePigs: { type: Number, default: 0 },
    leanMeat: { type: Number, default: 0 },
    bones: { type: Number, default: 0 },
    groundMeat: { type: Number, default: 0 },
    organs: { type: Number, default: 0 }
  },
  
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  
  processing: {
    slaughterTime: { type: Date },
    processingTime: { type: Number }, // minutes
    dressingPercentage: { type: Number }, // percentage
    meatYield: { type: Number }, // percentage
    qualityNotes: { type: String },
    veterinaryCheck: {
      passed: { type: Boolean, default: true },
      checkedBy: { type: String },
      notes: { type: String }
    }
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Poultry Processing
const poultryProcessingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  
  input: {
    livePoultry: {
      quantity: { type: Number, required: true }, // kg live weight
      count: { type: Number }, // number of birds
      avgWeight: { type: Number }, // kg per bird
      type: { type: String, enum: ['Gà', 'Vịt', 'Ngỗng', 'Cá'], default: 'Gà' },
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      price: { type: Number }, // per kg live weight
      carryOverFromPreviousDay: { type: Number, default: 0 }
    }
  },
  
  output: {
    processedMeat: {
      quantity: { type: Number, required: true }, // kg
      quality: { type: String, enum: ['Tốt', 'Khá', 'Trung bình'], default: 'Tốt' },
      pricePerKg: { type: Number, default: 150000 }
    },
    bones: { type: Number }, // kg
    feathers: { type: Number }, // kg
    organs: { type: Number }, // kg
    waste: { type: Number } // kg
  },
  
  remaining: {
    livePoultry: { type: Number, default: 0 },
    processedMeat: { type: Number, default: 0 }
  },
  
  financial: {
    totalInputCost: { type: Number, default: 0 },
    totalOutputValue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  
  processing: {
    slaughterTime: { type: Date },
    processingTime: { type: Number }, // minutes
    dressingPercentage: { type: Number }, // percentage
    yield: { type: Number }, // percentage
    qualityNotes: { type: String }
  },
  
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true })

// Add indexes and middleware for all schemas
const schemas = [
  { schema: tofuProcessingSchema, name: 'TofuProcessing' },
  { schema: saltProcessingSchema, name: 'SaltProcessing' },
  { schema: beanSproutsProcessingSchema, name: 'BeanSproutsProcessing' },
  { schema: sausageProcessingSchema, name: 'SausageProcessing' },
  { schema: livestockProcessingSchema, name: 'LivestockProcessing' },
  { schema: poultryProcessingSchema, name: 'PoultryProcessing' }
]

schemas.forEach(({ schema }) => {
  // Common indexes
  schema.index({ date: 1, unitId: 1 }, { unique: true })
  schema.index({ date: 1 })
  schema.index({ unitId: 1 })
  
  // Pre-save middleware for financial calculations
  schema.pre('save', function(next) {
    // Calculate financial metrics based on schema type
    this.financial.totalOutputValue = this.calculateOutputValue()
    this.financial.totalInputCost = this.calculateInputCost()
    this.financial.profit = this.financial.totalOutputValue - this.financial.totalInputCost
    this.financial.profitMargin = this.financial.totalInputCost > 0 
      ? (this.financial.profit / this.financial.totalInputCost) * 100 
      : 0
    
    next()
  })
  
  // Methods for financial calculations
  schema.methods.calculateOutputValue = function() {
    let total = 0
    if (this.output.tofu) total += this.output.tofu.quantity * this.output.tofu.pricePerKg
    if (this.output.pickledCabbage) total += this.output.pickledCabbage.quantity * this.output.pickledCabbage.pricePerKg
    if (this.output.beanSprouts) total += this.output.beanSprouts.quantity * this.output.beanSprouts.pricePerKg
    if (this.output.sausages) total += this.output.sausages.quantity * this.output.sausages.pricePerKg
    if (this.output.leanMeat) total += this.output.leanMeat.quantity * this.output.leanMeat.pricePerKg
    if (this.output.bones) total += this.output.bones.quantity * this.output.bones.pricePerKg
    if (this.output.groundMeat) total += this.output.groundMeat.quantity * this.output.groundMeat.pricePerKg
    if (this.output.organs) total += this.output.organs.quantity * this.output.organs.pricePerKg
    if (this.output.processedMeat) total += this.output.processedMeat.quantity * this.output.processedMeat.pricePerKg
    return total
  }
  
  schema.methods.calculateInputCost = function() {
    let total = 0
    if (this.input.soybeans) total += this.input.soybeans.quantity * this.input.soybeans.price
    if (this.input.cabbage) total += this.input.cabbage.quantity * this.input.cabbage.price
    if (this.input.porkMeat) total += this.input.porkMeat.quantity * this.input.porkMeat.price
    if (this.input.livePigs) total += this.input.livePigs.quantity * this.input.livePigs.price
    if (this.input.livePoultry) total += this.input.livePoultry.quantity * this.input.livePoultry.price
    return total
  }
})

// Export models
export const TofuProcessing = mongoose.model('TofuProcessing', tofuProcessingSchema)
export const SaltProcessing = mongoose.model('SaltProcessing', saltProcessingSchema)
export const BeanSproutsProcessing = mongoose.model('BeanSproutsProcessing', beanSproutsProcessingSchema)
export const SausageProcessing = mongoose.model('SausageProcessing', sausageProcessingSchema)
export const LivestockProcessing = mongoose.model('LivestockProcessing', livestockProcessingSchema)
export const PoultryProcessing = mongoose.model('PoultryProcessing', poultryProcessingSchema) 