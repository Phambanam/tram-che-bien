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
    <header className="bg-[#fff2cc] py-4">
      <div className="container flex items-center justify-between">
        <div className="flex items-center justify-center w-full">
          <div className="relative w-full max-w-4xl h-32 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/anh.jpg"
              alt="Ảnh đơn vị Lữ đoàn 279"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <h1 className="text-white text-3xl font-bold uppercase tracking-wider drop-shadow-lg">
                LỮ ĐOÀN 279
              </h1>
            </div>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="bg-[#cfe2f3] hover:bg-[#9fc5e8] text-black border-gray-300 ml-4 flex-shrink-0">
          ĐĂNG XUẤT
        </Button>
      </div>
    </header>
  )
}
