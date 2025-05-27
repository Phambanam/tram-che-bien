// User types
export interface User {
  id: string
  fullName: string
  position: string
  rank: string
  unit: {
    id: string
    name: string
  }
  phoneNumber: string // Changed from username to phoneNumber for login
  role: string
  status: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

// Unit types
export interface Unit {
  _id: string
  name: string
  description?: string
}

// ProductCategory types
export interface ProductCategory {
  _id: string
  name: string
  description?: string
}

// Product types
export interface Product {
  _id: string
  name: string
  category: {
    _id: string
    name: string
  }
  description?: string
  unit: string
  standardAmount?: number // Added standardAmount for per-person standard
}

// Supply types
export interface SupplySource {
  id: string
  unit: {
    _id: string
    name: string
  }
  category: {
    _id: string
    name: string
  }
  product: {
    _id: string
    name: string
  }
  supplyQuantity: number
  expectedHarvestDate: string
  stationEntryDate?: string
  receivedQuantity?: number
  status: "pending" | "approved" | "rejected" | "deleted"
  note?: string
  createdBy?: {
    id: string
    name: string
  }
  approvedBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

// Content types for articles/posts
export interface Content {
  id: string
  title: string
  type: "article" | "image" | "video"
  content?: string
  imageUrl?: string
  videoUrl?: string
  status: "published" | "draft"
  author?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

// Dish types
export interface Dish {
  id: string
  name: string
  ingredients: string
  description?: string
  imageUrl?: string
  category: string // rice, pork, beef, vegetable, soup, dessert, etc.
}

// Menu types
export interface Menu {
  id: string
  week: number
  year: number
  startDate: string
  endDate: string
  status: string
}

// DailyMenu types
export interface DailyMenu {
  id: string
  menuId: string
  date: string
  mealCount: number
  status: string
}

// Meal types
export interface Meal {
  id: string
  dailyMenuId: string
  type: "morning" | "noon" | "evening"
  dishes: Dish[]
}

// ProcessingStation types
export interface ProcessingStation {
  id: string
  productId: string
  processingDate: string
  useDate: string
  expiryDate: string
  quantity: number
  status: string
  nonExpiredQuantity: number
  expiredQuantity: number
  note?: string
}

// SupplyOutput types
export interface SupplyOutput {
  id: string
  productId: string
  quantity: number
  outputDate: string
  receivingUnit: string
  status: string
  note?: string
}

// RecipeIngredient types
export interface RecipeIngredient {
  id: string
  dishId: string
  productId: string
  quantity: number
  unit: string // kg, g, ml
}

// Report types
export interface ReportByUnitItem {
  _id: string
  unitName: string
  totalProducts: number
  totalSupplied: number
  totalReceived: number
  difference: number
  percentReceived: number
}

export interface ReportByCategoryItem {
  _id: string
  categoryName: string
  totalProducts: number
  totalSupplied: number
  totalReceived: number
  difference: number
  percentReceived: number
}

export interface ReportTotals {
  totalProducts: number
  totalSupplied: number
  totalReceived: number
  difference: number
  percentReceived: number
}

export interface ReportByUnitResponse {
  success: boolean
  data: {
    units: ReportByUnitItem[]
    totals: ReportTotals
  }
}

export interface ReportByCategoryResponse {
  success: boolean
  data: {
    categories: ReportByCategoryItem[]
    totals: ReportTotals
  }
}

export interface DetailedReportResponse {
  success: boolean
  count: number
  data: {
    supplies: SupplySource[]
    totals: ReportTotals
  }
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  count?: number
  errors?: any
}
