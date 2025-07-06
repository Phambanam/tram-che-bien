"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentApi = exports.reportsApi = exports.suppliesApi = exports.productsApi = exports.categoriesApi = exports.unitsApi = exports.usersApi = exports.authApi = void 0;
// API base URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
// Helper function to handle API errors
const handleApiError = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đã xảy ra lỗi khi gọi API");
    }
    return response.json();
};
// Function to get auth token from localStorage
const getToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};
// Generic fetch function with auth\
const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    return handleApiError(response);
};
// Auth API
exports.authApi = {
    login: async (username, password) => {
        return fetchWithAuth("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
    },
    register: async (userData) => {
        return fetchWithAuth("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    },
    getProfile: async () => {
        return fetchWithAuth("/auth/me");
    },
};
// Users API
exports.usersApi = {
    getUsers: async () => {
        return fetchWithAuth("/users");
    },
    getUserById: async (id) => {
        return fetchWithAuth(`/users/${id}`);
    },
    updateUser: async (id, data) => {
        return fetchWithAuth(`/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteUser: async (id) => {
        return fetchWithAuth(`/users/${id}`, {
            method: "DELETE",
        });
    },
};
// Units API
exports.unitsApi = {
    getUnits: async () => {
        return fetchWithAuth("/units");
    },
    getUnitById: async (id) => {
        return fetchWithAuth(`/units/${id}`);
    },
    createUnit: async (data) => {
        return fetchWithAuth("/units", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateUnit: async (id, data) => {
        return fetchWithAuth(`/units/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteUnit: async (id) => {
        return fetchWithAuth(`/units/${id}`, {
            method: "DELETE",
        });
    },
};
// Categories API
exports.categoriesApi = {
    getCategories: async () => {
        return fetchWithAuth("/categories");
    },
    getCategoryById: async (id) => {
        return fetchWithAuth(`/categories/${id}`);
    },
    createCategory: async (data) => {
        return fetchWithAuth("/categories", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateCategory: async (id, data) => {
        return fetchWithAuth(`/categories/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteCategory: async (id) => {
        return fetchWithAuth(`/categories/${id}`, {
            method: "DELETE",
        });
    },
};
// Products API
exports.productsApi = {
    getProducts: async (categoryId) => {
        const query = categoryId ? `?category=${categoryId}` : "";
        return fetchWithAuth(`/products${query}`);
    },
    getProductById: async (id) => {
        return fetchWithAuth(`/products/${id}`);
    },
    createProduct: async (data) => {
        return fetchWithAuth("/products", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateProduct: async (id, data) => {
        return fetchWithAuth(`/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteProduct: async (id) => {
        return fetchWithAuth(`/products/${id}`, {
            method: "DELETE",
        });
    },
};
// Supplies API
exports.suppliesApi = {
    getSupplies: async (filters) => {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
        }
        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth(`/supplies${query}`);
    },
    getSupplyById: async (id) => {
        return fetchWithAuth(`/supplies/${id}`);
    },
    createSupply: async (data) => {
        return fetchWithAuth("/supplies", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateSupply: async (id, data) => {
        return fetchWithAuth(`/supplies/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    approveSupply: async (id, data) => {
        return fetchWithAuth(`/supplies/${id}/approve`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteSupply: async (id) => {
        return fetchWithAuth(`/supplies/${id}`, {
            method: "DELETE",
        });
    },
    getFoodCategories: async () => {
        return fetchWithAuth("/supplies/categories");
    },
    getFoodProducts: async (categoryId) => {
        return fetchWithAuth(`/supplies/products/${categoryId}`);
    },
};
// Reports API
exports.reportsApi = {
    getReportByUnit: async (filters) => {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
        }
        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth(`/reports/by-unit${query}`);
    },
    getReportByCategory: async (filters) => {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
        }
        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth(`/reports/by-category${query}`);
    },
    getDetailedReport: async (filters) => {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
        }
        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth(`/reports/detailed${query}`);
    },
};
// Content/Articles API
exports.contentApi = {
    getContent: async (type) => {
        const query = type ? `?type=${type}` : "";
        return fetchWithAuth(`/content${query}`);
    },
    getContentById: async (id) => {
        return fetchWithAuth(`/content/${id}`);
    },
    createContent: async (data) => {
        return fetchWithAuth("/content", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateContent: async (id, data) => {
        return fetchWithAuth(`/content/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
    deleteContent: async (id) => {
        return fetchWithAuth(`/content/${id}`, {
            method: "DELETE",
        });
    },
};
