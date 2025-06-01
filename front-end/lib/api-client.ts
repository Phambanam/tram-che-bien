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
    ...options,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('API Error:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      errorData
    })
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username, password }),
    })
  },

  register: async (userData: any) => {
    return apiRequest<{ success: boolean; message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  getProfile: async () => {
    return apiRequest<any>("/auth/me")
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

  deleteUnit: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/units/${id}`, {
      method: "DELETE",
    })
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
  getProducts: async (categoryId?: string) => {
    const query = categoryId ? `?category=${categoryId}` : ""
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

  deleteSupply: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/supplies/${id}`, {
      method: "DELETE",
    })
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
    return apiRequest<{ success: boolean; count: number; data: any[] }>(`/content${query}`)
  },

  getContentById: async (id: string) => {
    return apiRequest<any>(`/content/${id}`)
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
}

// Supply Outputs API
export const supplyOutputsApi = {
  getSupplyOutputs: async () => {
    return apiRequest<any[]>("/supply-outputs")
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
}

// Upload API
export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
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
    return apiRequest<any>(`/lttp${query}`)
  },

  getLTTPById: async (id: string) => {
    return apiRequest<any>(`/lttp/${id}`)
  },

  createLTTP: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>("/lttp", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateLTTP: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string }>(`/lttp/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteLTTP: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/lttp/${id}`, {
      method: "DELETE",
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
}
