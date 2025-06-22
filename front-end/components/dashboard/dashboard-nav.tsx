"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, Users, Library, BarChart, Settings } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles: string[] // Các vai trò được phép truy cập
}

export function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user.role || ""

  const navItems: NavItem[] = [
    {
      title: "Tổng quan",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      roles: ["admin", "brigadeAssistant", "unitAssistant", "commander", "stationManager"], // Tất cả vai trò
    },
    {
      title: "Quản lý nguồn nhập",
      href: "/dashboard/supplies",
      icon: <Package className="mr-2 h-4 w-4" />,
      roles: ["admin", "brigadeAssistant", "unitAssistant", "commander", "stationManager"], // Tất cả vai trò
    },
    {
      title: "Quản lý người dùng",
      href: "/dashboard/users",
      icon: <Users className="mr-2 h-4 w-4" />,
      roles: ["admin"], // Chỉ admin
    },
    {
      title: "Thư viện dữ liệu",
      href: "/dashboard/library",
      icon: <Library className="mr-2 h-4 w-4" />,
      roles: ["admin", "brigadeAssistant", "stationManager"], // Admin, trợ lý lữ đoàn và trạm trưởng
    },
    {
      title: "Báo cáo thống kê",
      href: "/dashboard/reports",
      icon: <BarChart className="mr-2 h-4 w-4" />,
      roles: ["admin", "brigadeAssistant", "commander", "stationManager"], // Admin, trợ lý lữ đoàn, chỉ huy và trạm trưởng
    },
    {
      title: "Cài đặt",
      href: "/dashboard/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      roles: ["admin", "brigadeAssistant", "unitAssistant", "commander", "stationManager"], // Tất cả vai trò
    },
  ]

  // Lọc các mục điều hướng theo vai trò
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="grid items-start gap-2">
      {filteredNavItems.map((item, index) => (
        <Link key={index} href={item.href}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn("w-full justify-start", pathname === item.href && "bg-muted font-medium")}
          >
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
