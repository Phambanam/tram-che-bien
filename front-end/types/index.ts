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
  stationEntryDate?: string
  receivedQuantity?: number
  requestedQuantity?: number
  actualQuantity?: number
  unitPrice?: number
  totalPrice?: number
  expiryDate?: string
  status: "pending" | "approved" | "rejected" | "deleted" | "received"
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

// SupplyOutputRequest types
export interface SupplyOutputRequest {
  id: string
  productId: string
  product: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  requestingUnit: {
    id: string
    name: string
  }
  quantity: number
  requestDate: string
  priority: "normal" | "urgent" | "critical"
  reason: string
  status: "pending" | "approved" | "rejected"
  note?: string
  rejectReason?: string
  createdBy: {
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

// SupplyOutputRequestFormData
export interface SupplyOutputRequestFormData {
  productId: string
  quantity: number
  requestDate: string
  priority: "normal" | "urgent" | "critical"
  reason: string
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

// Notification types
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
  createdAt: string
  updatedAt: string
}

// Role types
export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
}

// Statistics types
export interface StatisticsOverview {
  totalSupplies: number
  totalUnits: number
  totalProducts: number
  totalCategories: number
  pendingSupplies: number
  approvedSupplies: number
}

export interface SupplyTrend {
  date: string
  count: number
  quantity: number
}

export interface CategoryDistribution {
  categoryName: string
  count: number
  percentage: number
}

export interface UnitPerformance {
  unitName: string
  totalSupplies: number
  approvedSupplies: number
  pendingSupplies: number
  performanceScore: number
}

// Form types for components
export interface SupplyFormData {
  unit: string
  category: string
  product: string
  supplyQuantity: number
  expiryDate?: string
  note?: string
}

export interface UserFormData {
  fullName: string
  phoneNumber: string
  rank: string
  position: string
  unit: string
  role: string
  password?: string
}

export interface UnitFormData {
  name: string
  description?: string
}

export interface CategoryFormData {
  name: string
  description?: string
}

export interface ProductFormData {
  name: string
  category: string
  unit: string
  description?: string
  standardAmount?: number
}

export interface ContentFormData {
  title: string
  type: "article" | "image" | "video"
  content?: string
  imageUrl?: string
  videoUrl?: string
  status: "published" | "draft"
}

// Filter types
export interface SupplyFilters {
  unit?: string
  category?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  unit?: string
  category?: string
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  count: number
  totalCount: number
  totalPages: number
  currentPage: number
  message?: string
}

// Upload types
export interface UploadResponse {
  success: boolean
  message: string
  data: {
    url: string
    filename: string
    originalName: string
    size: number
  }
}

// Session types for NextAuth
export interface SessionUser {
  id: string
  fullName: string
  phoneNumber: string
  role: string
  unit: {
    id: string
    name: string
  }
}

export interface Session {
  user: SessionUser
  token: string
  expires: string
} 