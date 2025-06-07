"use client"
import { Button } from "@/components/ui/button"
import { useAuth } from  "@/components/auth/auth-provider"
import Image from "next/image"

export function SiteHeader() {
  const { logout } = useAuth()
  const handleLogout = async () => {
    try {
      await logout()  
      window.location.href = '/auth/login' // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error)
    }
  }
  return (
    <header className="bg-[#fff2cc] py-2 w-full">
      <div className="relative w-full h-32">
        <Image
          src="/anh.jpg"
          alt="Ảnh đơn vị Lữ đoàn 279"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-between px-6">
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h2 className="text-white text-lg font-bold uppercase tracking-wide drop-shadow-lg mb-1">
                PHẦN MỀM QUẢN LÝ TRẠM CHẾ BIẾN
              </h2>
              <h1 className="text-white text-3xl font-bold uppercase tracking-wider drop-shadow-lg">
                LỮ ĐOÀN 279
              </h1>
            </div>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="bg-white/90 hover:bg-white text-black border-gray-300 shadow-lg backdrop-blur-sm"
          >
            ĐĂNG XUẤT
          </Button>
        </div>
      </div>
    </header>
  )
}
