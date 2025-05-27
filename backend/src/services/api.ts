import type { AuthResponse, ApiResponse } from "../types"

// API base URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

// Helper function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Đã xảy ra lỗi khi gọi API")
  }
  return response.json()
}

// Function to get auth token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Generic fetch function with auth
const fetchWithAuth = async <T>(\
  endpoint: string,
  options: RequestInit = {}
)
  : Promise<T> => {
  const token = getToken()
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return handleApiError(response)
}

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return fetchWithAuth<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  },

  register: async (userData: any): Promise<ApiResponse<{ userId: string }>> => {
    return fetchWithAuth<ApiResponse<{ userId: string }>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/auth/me")
  },
}

// Users API
export const usersApi = {
  getUsers: async (): Promise<ApiResponse<any[]>> => {
    return fetchWithAuth<ApiResponse<any[]>>("/users")
  },

  getUserById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/users/${id}`)
  },

  updateUser: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteUser: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/users/${id}`, {
      method: "DELETE",
    })
  },
}

// Units API
export const unitsApi = {
  getUnits: async (): Promise<ApiResponse<any[]>> => {
    return fetchWithAuth<ApiResponse<any[]>>("/units")
  },

  getUnitById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/units/${id}`)
  },

  createUnit: async (data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/units", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateUnit: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/units/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteUnit: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/units/${id}`, {
      method: "DELETE",
    })
  },
}

// Categories API
export const categoriesApi = {
  getCategories: async (): Promise<ApiResponse<any[]>> => {
    return fetchWithAuth<ApiResponse<any[]>>("/categories")
  },

  getCategoryById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/categories/${id}`)
  },

  createCategory: async (data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateCategory: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteCategory: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/categories/${id}`, {
      method: "DELETE",
    })
  },
}

// Products API
export const productsApi = {
  getProducts: async (categoryId?: string): Promise<ApiResponse<any[]>> => {
    const query = categoryId ? `?category=${categoryId}` : ""
    return fetchWithAuth<ApiResponse<any[]>>(`/products${query}`)
  },

  getProductById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/products/${id}`)
  },

  createProduct: async (data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateProduct: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteProduct: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/products/${id}`, {
      method: "DELETE",
    })
  },
}

// Supplies API
export const suppliesApi = {
  getSupplies: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth<ApiResponse<any[]>>(`/supplies${query}`)
  },

  getSupplyById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/supplies/${id}`)
  },

  createSupply: async (data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/supplies", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateSupply: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/supplies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  approveSupply: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/supplies/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteSupply: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/supplies/${id}`, {
      method: "DELETE",
    })
  },
}

// Reports API
export const reportsApi = {
  getReportByUnit: async (filters?: any): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth<ApiResponse<any>>(`/reports/by-unit${query}`)
  },

  getReportByCategory: async (filters?: any): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth<ApiResponse<any>>(`/reports/by-category${query}`)
  },

  getDetailedReport: async (filters?: any): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string)
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth<ApiResponse<any>>(`/reports/detailed${query}`)
  },
}

// Content/Articles API
export const contentApi = {
  getContent: async (type?: string): Promise<ApiResponse<any[]>> => {
    const query = type ? `?type=${type}` : ""
    return fetchWithAuth<ApiResponse<any[]>>(`/content${query}`)
  },

  getContentById: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/content/${id}`)
  },

  createContent: async (data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>("/content", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateContent: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/content/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  deleteContent: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<ApiResponse<any>>(`/content/${id}`, {
      method: "DELETE",
    })
  },
}
