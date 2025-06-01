"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api-client"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (token && storedUser) {
        try {
          // Verify token by fetching user profile
          const response = await authApi.getProfile()
          console.log("Profile response:", response)
          
          if (response && response.data) {
            // Set user data from API response
            setUser(response.data)
          } else {
            throw new Error("Invalid profile response")
          }
        } catch (error) {
          console.error("Auth initialization error:", error)
          logout()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string):
    Promise<{ token: string; user: User }> => {
    console.log('Auth provider login called with:', { username, password })
    
    try {
      // Make login request and get raw response
      const response = await authApi.login(username, password)
      console.log('Auth provider received response:', response)
      
      // If login was successful, store data and redirect
      if (response && response.token && response.user) {
        console.log('Login successful, storing token and user data')
        
        // Store token in localStorage for persistence
        localStorage.setItem("token", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
        
        // Also set a cookie that the middleware can access
        document.cookie = `auth-token=${response.token}; path=/; max-age=86400; SameSite=Lax`
        
        // Set the user state
        setUser(response.user)
        
        console.log('Auth data stored, ready for redirect')
        
        // Return the response to allow login-form.tsx to handle the redirect
        return response
      } else {
        throw new Error("Invalid login response format")
      }
    } catch (error) {
      console.error('Error in auth provider login:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("auth-token")
    
    // Clear the auth cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
