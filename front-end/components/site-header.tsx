"use client"
import { Button } from "@/components/ui/button"
import { useAuth } from  "@/components/auth/auth-provider"
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
        <h1 className="text-center text-xl font-bold uppercase tracking-wider text-[#b45f06] w-full">
          ẢNH ĐƠN VỊ LỮ ĐOÀN 279
        </h1>
        <Button onClick={handleLogout} variant="outline" className="bg-[#cfe2f3] hover:bg-[#9fc5e8] text-black border-gray-300">
          ĐĂNG XUẤT
        </Button>
      </div>
    </header>
  )
}
