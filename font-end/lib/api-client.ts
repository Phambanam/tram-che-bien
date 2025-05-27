const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

interface ApiError {
  message: string
  status: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface User {
  id: string
  fullName: string
  username: string
  role: string
  unit: {
    id: string
    name: string
  }
}

export interface LoginResponse {
  token: string
  user: User
}

export interface UserProfile extends User {
  rank: string
  position: string
  status: string
}

// Generic pagination response interface
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  console.log('Raw API response:', data)
  
  if (!response.ok) {
    throw {
      message: data.message || 'Có lỗi xảy ra',
      status: response.status
    } as ApiError
  }
  
  return data
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  console.log(`Sending request to: ${API_BASE_URL}${url}`)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    })
    
    if (response.status === 0 || response.type === 'opaque') {
      throw new Error('CORS error occurred');
    }
    
    return response
  } catch (error) {
    console.error('Fetch error:', error)
    throw {
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      status: 500
    } as ApiError
  }
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, string | number>) {
    // Add pagination parameters to URL if provided
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url = `${url}?${queryParams.toString()}`;
    }
    
    const response = await fetchWithAuth(url);
    return handleResponse<ApiResponse<T>>(response);
  },

  // Add paginated version of get
  async getPaginated<T>(url: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    
    const fullUrl = `${url}?${params.toString()}`;
    const response = await fetchWithAuth(fullUrl);
    return handleResponse<PaginatedResponse<T>>(response);
  },

  async post<T>(url: string, data: any) {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return handleResponse<ApiResponse<T>>(response)
  },

  async put<T>(url: string, data: any) {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return handleResponse<ApiResponse<T>>(response)
  },

  async patch<T>(url: string, data: any) {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return handleResponse<ApiResponse<T>>(response)
  },

  async delete<T>(url: string) {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
    })
    return handleResponse<ApiResponse<T>>(response)
  },
}

// Auth API
export const authApi = {
  async login(username: string, password: string) {
    try {
      const response = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      console.log('Login raw response data:', data);
      
      if (!response.ok) {
        throw {
          message: data.message || 'Login failed',
          status: response.status
        };
      }
      
      return {
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  async register(data: any) {
    return apiClient.post<{ userId: string }>('/auth/register', data)
  },

  async getProfile() {
    return apiClient.get<UserProfile>('/auth/me')
  },
}

// Users API
export const usersApi = {
  async getAll() {
    return apiClient.get<User[]>('/users')
  },

  async getById(id: string) {
    return apiClient.get<User>(`/users/${id}`)
  },

  async update(id: string, data: any) {
    return apiClient.patch<User>(`/users/${id}`, data)
  },

  async delete(id: string) {
    return apiClient.delete<void>(`/users/${id}`)
  },
}

// Units API
export const unitsApi = {
  async getAll() {
    return apiClient.get<User[]>('/units')
  },

  async getById(id: string) {
    return apiClient.get<User>(`/units/${id}`)
  },

  async create(data: any) {
    return apiClient.post<User>('/units', data)
  },

  async update(id: string, data: any) {
    return apiClient.patch<User>(`/units/${id}`, data)
  },

  async delete(id: string) {
    return apiClient.delete<void>(`/units/${id}`)
  },
}

// Supplies API
export interface Supply {
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
  quantity: number
  harvestDate: string
  stationEntryDate: string | null
  receivedQuantity: number | null
  status: string
  note: string
  createdBy?: {
    id: string
    name: string
  }
  approvedBy?: {
    id: string
    name: string
  }
  createdAt?: string
  updatedAt?: string
}

export const suppliesApi = {
  async getAll(filters?: any) {
    const params: Record<string, string | number> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value as string | number;
        }
      });
    }
    return apiClient.get<Supply[]>('/supplies', params);
  },

  async getById(id: string) {
    return apiClient.get<Supply>(`/supplies/${id}`);
  },

  async create(data: any) {
    return apiClient.post<Supply>('/supplies', data);
  },

  async update(id: string, data: any) {
    return apiClient.patch<Supply>(`/supplies/${id}`, data);
  },
  
  async approve(id: string, data: any) {
    return apiClient.patch<Supply>(`/supplies/${id}/approve`, data);
  },

  async delete(id: string) {
    return apiClient.delete<void>(`/supplies/${id}`);
  }
} 