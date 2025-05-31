"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function SupplyAddButton() {
  const [canAddSupply, setCanAddSupply] = useState(false)

  useEffect(() => {
    // Kiểm tra quyền dựa trên JWT token
    const checkPermission = () => {
      try {
        const user = localStorage.getItem("user")
        //convert to User object
        const payload = user ? JSON.parse(user) : null
        if (!payload) return false

       
        // Kiểm tra quyền thêm mới nguồn nhập
        const role = payload.role
        return role === "admin" || role === "unitAssistant"
      } catch (error) {
        console.error("Error checking permission:", error)
        return false
      }
    }

    setCanAddSupply(checkPermission())
  }, [])

  if (!canAddSupply) return null

  return (
    <Link href="/dashboard/supplies/new">
      <Button className="bg-primary hover:bg-primary/90">
        <Plus className="mr-2 h-4 w-4" />
        Thêm mới
      </Button>
    </Link>
  )
}