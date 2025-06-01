"use client"

import { useEffect, useState } from "react"

export function DebugToken() {
  const [tokenInfo, setTokenInfo] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const user = localStorage.getItem("user")
      
      let decodedToken = null
      if (token) {
        try {
          // Decode JWT token (just the payload, not verifying signature)
          const payload = JSON.parse(atob(token.split('.')[1]))
          decodedToken = {
            ...payload,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString(),
            isExpired: payload.exp * 1000 < Date.now()
          }
        } catch (e) {
          decodedToken = { error: "Invalid token format" }
        }
      }

      setTokenInfo({
        hasToken: !!token,
        tokenLength: token?.length || 0,
        hasUser: !!user,
        decodedToken,
        user: user ? JSON.parse(user) : null
      })
    }
  }, [])

  if (!tokenInfo) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug Token Info</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(tokenInfo, null, 2)}
      </pre>
    </div>
  )
} 