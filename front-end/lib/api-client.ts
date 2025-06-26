// API client for communicating with the backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Helper function for making API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  
  // Debug logging
  console.log('API Request:', {
    endpoint,
    token: token ? `${token.substring(0, 20)}...` : 'No token',
    hasToken: !!token
  })

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
    },
    mode: 'cors',
    credentials: 'include',
    ...options,
  }

  try {
    // Try using IP address first
    let url = `${API_BASE_URL}${endpoint}`;
    console.log(`Attempting fetch to: ${url}`);
    
    // First try with the configured URL
    let response = await fetch(url, config);
    
    // If that fails, try with 127.0.0.1 instead of localhost
    if (!response.ok && url.includes('localhost')) {
      const altUrl = url.replace('localhost', '127.0.0.1');
      console.log(`Retrying with IP address: ${altUrl}`);
      response = await fetch(altUrl, config);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    // Handle network errors
    console.error('Network Error:', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      url: `${API_BASE_URL}${endpoint}`
    });
    
    // Try alternative URL with IP if using localhost
    if (API_BASE_URL.includes('localhost') && error instanceof Error && error.message.includes('Failed to fetch')) {
      try {
        const altUrl = `${API_BASE_URL.replace('localhost', '127.0.0.1')}${endpoint}`;
        console.log(`Connection refused, trying IP address: ${altUrl}`);
        
        const response = await fetch(altUrl, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        throw new Error('Unable to connect to the server. Please check your network connection and try again.');
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (phoneNumber: string, password: string) => {
    console.log('🚀 API client login called')
    
    try {
      const response = await apiRequest<{ success: boolean; data: { token: string; user: any } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phoneNumber, password }),
      })
      
      console.log('🔍 API client raw response:', response)
      
      // Extract data from response to match expected format
      if (response.success && response.data) {
        console.log('✅ API client extracting data:', response.data)
        return response.data
      } else {
        console.log('❌ API client invalid response format:', response)
        return {
          success: false,
          message: "Định dạng phản hồi đăng nhập không hợp lệ"
        }
      }
    } catch (error: any) {
      console.log('🔥 API client error:', error)
      return {
        success: false,
        message: error.message || "Đã xảy ra lỗi khi đăng nhập"
      }
    }
  },

  register: async (userData: any) => {
    console.log('🚀 API client register called with:', userData)
    
    try {
      const response = await apiRequest<{ success: boolean; message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      })
      
      console.log('✅ API client register response:', response)
      return response
    } catch (error: any) {
      console.error('🔥 API client register error:', error)
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
        return {
          success: false,
          message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
        }
      }
      
      return {
        success: false,
        message: error.message || "Đã xảy ra lỗi khi đăng ký"
      }
    }
  },

  getProfile: async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>("/auth/me")
      
      // Extract data from response
      if (response.success && response.data) {
        return { data: response.data }
      } else {
        return {
          success: false,
          message: "Định dạng phản hồi profile không hợp lệ"
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Đã xảy ra lỗi khi lấy thông tin profile"
      }
    }
  },
}

// Users API
export const usersApi = {
  getUsers: async () => {
    return apiRequest<any[]>("/users")
  },

  getUserById: async (id: string) => {
    return apiRequest<any>(`/users/${id}`)
  },

  updateUser: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteUser: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "DELETE",
    })
  },
}

// Units API
export const unitsApi = {
  getUnits: async () => {
    return apiRequest<any[]>("/units")
  },

  getUnitById: async (id: string) => {
    return apiRequest<any>(`/units/${id}`)
  },

  createUnit: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/units", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateUnit: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/units/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  updateUnitPersonnel: async (id: string, personnel: number) => {
    return apiRequest<{ success: boolean; message: string; data: any }>(`/units/${id}/personnel`, {
      method: "PATCH",
      body: JSON.stringify({ personnel }),
    })
  },

  deleteUnit: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/units/${id}`, {
      method: "DELETE",
    })
  },

  // Total personnel APIs
  updateTotalPersonnel: async (date: string, totalPersonnel: number) => {
    return apiRequest<{ success: boolean; message: string }>(`/units/total-personnel`, {
      method: "PATCH",
      body: JSON.stringify({ date, totalPersonnel }),
    })
  },

  getTotalPersonnel: async (date: string) => {
    return apiRequest<{ success: boolean; data: { date: string; totalPersonnel: number; exists: boolean } }>(`/units/total-personnel/${date}`)
  },
}

// Categories API
export const categoriesApi = {
  getCategories: async () => {
    return apiRequest<any[]>("/categories")
  },

  getCategoryById: async (id: string) => {
    return apiRequest<any>(`/categories/${id}`)
  },

  createCategory: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateCategory: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteCategory: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: "DELETE",
    })
  },
}

// Products API
export const productsApi = {
  getProducts: async (categoryId?: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams()
    if (categoryId) queryParams.append("category", categoryId)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any[]>(`/products${query}`)
  },

  getAllProducts: async (categoryId?: string) => {
    // Get all products by setting a high limit
    const queryParams = new URLSearchParams()
    if (categoryId) queryParams.append("category", categoryId)
    queryParams.append("limit", "1000") // Set high limit to get all products
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any[]>(`/products${query}`)
  },

  getProductById: async (id: string) => {
    return apiRequest<any>(`/products/${id}`)
  },

  createProduct: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateProduct: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteProduct: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
      method: "DELETE",
    })
  },
}

// Supplies API
export const suppliesApi = {
  getSupplies: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any[]>(`/supplies${query}`)
  },

  getSupplyById: async (id: string) => {
    return apiRequest<any>(`/supplies/${id}`)
  },

  createSupply: async (data: any) => {
    return apiRequest<{ success: boolean; message: string; data: any }>("/supplies", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateSupply: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  approveSupply: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  rejectSupply: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  receiveSupply: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}/receive`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteSupply: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}`, {
      method: "DELETE",
    })
  },

  exportSuppliesExcel: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    
    const token = getAuthToken()
    
    try {
      // Use Next.js API proxy instead of direct backend call
      const response = await fetch(`/api/supplies/export${query}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        console.error("Export failed with status:", response.status)
        console.error("Response headers:", [...response.headers.entries()])
        throw new Error(`Failed to export Excel: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `phieu-nhap-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      return { success: true }
    } catch (error) {
      console.error("Error exporting Excel:", error)
      throw error
    }
  },

  getFoodCategories: async () => {
    return apiRequest<any[]>("/supplies/categories")
  },

  getFoodProducts: async (categoryId: string) => {
    return apiRequest<any[]>(`/supplies/products/${categoryId}`)
  },
}

// Reports API
export const reportsApi = {
  getReportByUnit: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/reports/by-unit${query}`)
  },

  getReportByCategory: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/reports/by-category${query}`)
  },

  getDetailedReport: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/reports/detailed${query}`)
  },
}

// Statistics API
export const statisticsApi = {
  getOverview: async () => {
    return apiRequest<any>("/statistics/overview")
  },

  getTrends: async () => {
    return apiRequest<any>("/statistics/trends")
  },

  getDistribution: async () => {
    return apiRequest<any>("/statistics/distribution")
  },

  getPerformance: async () => {
    return apiRequest<any>("/statistics/performance")
  },
}

// Content/Articles API
export const contentApi = {
  getContent: async (type?: string) => {
    const query = type ? `?type=${type}` : ""
    const response = await apiRequest<{ success: boolean; count: number; data: any[] }>(`/content${query}`)
    return response.data
  },

  getContentById: async (id: string) => {
    // Validate ID before making request
    if (!id || id === 'undefined' || id === 'null') {
      return {
        success: false,
        message: 'ID nội dung không được để trống'
      }
    }
    
    // Basic ID format validation (check if it looks like a valid ObjectId)
    if (id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return {
        success: false,
        message: `ID nội dung không hợp lệ: ${id}`
      }
    }
    
    try {
      console.log('Getting content by ID:', id)
      const response = await apiRequest<{ success: boolean; data: any }>(`/content/${id}`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Đã xảy ra lỗi khi lấy nội dung"
      }
    }
  },

  createContent: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/content", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateContent: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/content/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteContent: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/content/${id}`, {
      method: "DELETE",
    })
  },
}

// Notifications API
export const notificationsApi = {
  getUserNotifications: async () => {
    return apiRequest<any[]>("/notifications")
  },

  markAsRead: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: "PATCH",
    })
  },

  markAllAsRead: async () => {
    return apiRequest<{ success: boolean; message: string }>("/notifications/mark-all-read", {
      method: "PATCH",
    })
  },

  sendNotification: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/notifications/send", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getPreferences: async () => {
    return apiRequest<any>("/notifications/preferences")
  },

  updatePreferences: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
}

// Roles API
export const rolesApi = {
  getRoles: async () => {
    return apiRequest<any[]>("/roles")
  },

  getUsersByRole: async (roleId: string) => {
    return apiRequest<any[]>(`/roles/${roleId}/users`)
  },

  updateUserRole: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/roles/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
}

// Print API
export const printApi = {
  printSupplies: async () => {
    return apiRequest<any>("/print/supplies")
  },

  printUnitReport: async () => {
    return apiRequest<any>("/print/reports/by-unit")
  },

  printCategoryReport: async () => {
    return apiRequest<any>("/print/reports/by-category")
  },
}

// Dishes API
export const dishesApi = {
  getDishes: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    console.log("getDishes API call with filters:", filters)
    console.log("Generated query string:", query)
    console.log("Full URL:", `/dishes${query}`)
    return apiRequest<any>(`/dishes${query}`)
  },

  getDishById: async (id: string) => {
    return apiRequest<any>(`/dishes/${id}`)
  },

  getDishesByIngredient: async (lttpId: string) => {
    return apiRequest<any>(`/dishes/by-ingredient/${lttpId}`)
  },

  getDishesByMainLTTP: async (lttpId: string) => {
    return apiRequest<any>(`/dishes/by-main-lttp/${lttpId}`)
  },

  createDish: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/dishes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateDish: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/dishes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteDish: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/dishes/${id}`, {
      method: "DELETE",
    })
  },
}

// Menus API
export const menusApi = {
  getMenus: async () => {
    return apiRequest<any[]>("/menus")
  },

  getMenuById: async (id: string) => {
    return apiRequest<any>(`/menus/${id}`)
  },

  createMenu: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/menus", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateMenu: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteMenu: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/${id}`, {
      method: "DELETE",
    })
  },

  createDailyMenu: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/${id}/daily-menus`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateDailyMenu: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/daily-menus/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteDailyMenu: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/daily-menus/${id}`, {
      method: "DELETE",
    })
  },

  copyDailyMenu: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/daily-menus/${id}/copy`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateMealDishes: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/meals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  addDishToMeal: async (id: string, data: { dishId: string; notes?: string }) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/meals/${id}/dishes`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  removeDishFromMeal: async (id: string, dishId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/meals/${id}/dishes/${dishId}`, {
      method: "DELETE",
    })
  },

  approveDailyMenu: async (dailyMenuId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/daily-menus/${dailyMenuId}/approve`, {
      method: "POST",
    })
  },

  rejectDailyMenu: async (dailyMenuId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/menus/daily-menus/${dailyMenuId}/reject`, {
      method: "POST",
    })
  },
}

// Processing Station API
export const processingStationApi = {
  getItems: async () => {
    return apiRequest<any[]>("/processing-station")
  },

  getItemById: async (id: string) => {
    return apiRequest<any>(`/processing-station/${id}`)
  },

  createItem: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/processing-station", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateItem: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/processing-station/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteItem: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/processing-station/${id}`, {
      method: "DELETE",
    })
  },

  getFoodInventory: async () => {
    return apiRequest<any[]>("/processing-station/food-inventory")
  },

  updateExpiryStatus: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/processing-station/update-expiry", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // New methods for daily tofu processing
  getDailyData: async (date: string) => {
    return apiRequest<any>(`/processing-station/daily/${date}`)
  },

  updateDailyData: async (date: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/processing-station/daily/${date}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // New methods for daily sausage processing
  getDailySausageData: async (date: string) => {
    return apiRequest<any>(`/processing-station/sausage/${date}`)
  },

  updateDailySausageData: async (date: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/processing-station/sausage/${date}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
}

// Supply Outputs API
export const supplyOutputsApi = {
  getSupplyOutputs: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any[]>(`/supply-outputs${query}`)
  },

  getSupplyOutputById: async (id: string) => {
    return apiRequest<any>(`/supply-outputs/${id}`)
  },

  createSupplyOutput: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/supply-outputs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateSupplyOutput: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/supply-outputs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteSupplyOutput: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/supply-outputs/${id}`, {
      method: "DELETE",
    })
  },

  // New methods for planned outputs
  generatePlannedOutputs: async (data: { week: number; year: number; overwriteExisting?: boolean }) => {
    return apiRequest<{ success: boolean; message: string; data: any }>("/supply-outputs/generate-planned", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getPlannedVsActual: async (params: { week: number; year: number; unitId?: string; productId?: string }) => {
    const queryParams = new URLSearchParams()
    queryParams.append("week", params.week.toString())
    queryParams.append("year", params.year.toString())
    if (params.unitId) queryParams.append("unitId", params.unitId)
    if (params.productId) queryParams.append("productId", params.productId)
    
    return apiRequest<{ success: boolean; data: any[]; summary: any }>(`/supply-outputs/planned-vs-actual?${queryParams.toString()}`)
  },

  updatePlannedOutput: async (id: string, data: { quantity?: number; note?: string; status?: string }) => {
    return apiRequest<{ success: boolean; message: string }>(`/supply-outputs/planned/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
}

// Upload API
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/upload/file`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  },
  
  deleteFile: async (filename: string) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/upload/file/${filename}`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  },
}

// Daily Rations API
export const dailyRationsApi = {
  getDailyRations: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/daily-rations${query}`)
  },

  getDailyRationById: async (id: string) => {
    return apiRequest<any>(`/daily-rations/${id}`)
  },

  getDailyRationsByCategory: async (category: string) => {
    return apiRequest<any>(`/daily-rations/by-category/${category}`)
  },

  getTotalDailyCost: async () => {
    return apiRequest<any>("/daily-rations/total-cost")
  },

  createDailyRation: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/daily-rations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateDailyRation: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/daily-rations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteDailyRation: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/daily-rations/${id}`, {
      method: "DELETE",
    })
  },
}

// LTTP API
export const lttpApi = {
  getLTTP: async (filters?: any) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/products${query}`)
  },

  getLTTPById: async (id: string) => {
    return apiRequest<any>(`/products/${id}`)
  },

  createLTTP: async (data: any) => {
    console.log(data)
    return apiRequest<{ success: boolean; message: string }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateLTTP: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteLTTP: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
      method: "DELETE",
    })
  },
}

// Menu Planning API
export const menuPlanningApi = {
  getMenuSuggestions: async () => {
    return apiRequest<any>("/menu-planning/suggestions")
  },

  getInventoryAlerts: async () => {
    return apiRequest<any>("/menu-planning/alerts")
  },

  generateDailyPlan: async (date: string) => {
    return apiRequest<any>("/menu-planning/daily-plan", {
      method: "POST",
      body: JSON.stringify({ date }),
    })
  },

  getOverview: async () => {
    return apiRequest<any>("/menu-planning/overview")
  },

  getDailyIngredientSummaries: async (params: {
    week?: number
    year?: number
    date?: string
    showAllDays?: boolean
  }) => {
    const queryParams = new URLSearchParams()
    if (params.week) queryParams.append("week", params.week.toString())
    if (params.year) queryParams.append("year", params.year.toString())
    if (params.date) queryParams.append("date", params.date)
    if (params.showAllDays !== undefined) queryParams.append("showAllDays", params.showAllDays.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return apiRequest<any>(`/menu-planning/ingredient-summaries${query}`)
  },
}

// Unit Personnel Daily API
export const unitPersonnelDailyApi = {
  getPersonnelByWeek: async (startDate: string, endDate: string) => {
    return apiRequest<{ success: boolean; data: { [date: string]: { [unitId: string]: number } } }>(`/unit-personnel-daily/week?startDate=${startDate}&endDate=${endDate}`)
  },

  updatePersonnelForDate: async (unitId: string, date: string, personnel: number) => {
    return apiRequest<{ success: boolean; message: string; data: any }>("/unit-personnel-daily/update", {
      method: "PUT",
      body: JSON.stringify({ unitId, date, personnel }),
    })
  },

  batchUpdatePersonnel: async (updates: Array<{ unitId: string; date: string; personnel: number }>) => {
    return apiRequest<{ success: boolean; message: string; data: any[] }>("/unit-personnel-daily/batch-update", {
      method: "PUT",
      body: JSON.stringify({ updates }),
    })
  },
}

// Export all APIs for convenience
export const api = {
  auth: authApi,
  users: usersApi,
  units: unitsApi,
  categories: categoriesApi,
  products: productsApi,
  supplies: suppliesApi,
  reports: reportsApi,
  statistics: statisticsApi,
  content: contentApi,
  notifications: notificationsApi,
  roles: rolesApi,
  print: printApi,
  dishes: dishesApi,
  menus: menusApi,
  processingStation: processingStationApi,
  supplyOutputs: supplyOutputsApi,
  upload: uploadApi,
  dailyRations: dailyRationsApi,
  lttp: lttpApi,
  menuPlanning: menuPlanningApi,
  unitPersonnelDaily: unitPersonnelDailyApi,
}
