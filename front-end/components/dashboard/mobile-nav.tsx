"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Menu, Package, Users, Library, BarChart, Settings } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      title: "Tổng quan",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: "Quản lý nguồn nhập",
      href: "/dashboard/supplies",
      icon: <Package className="mr-2 h-4 w-4" />,
    },
    {
      title: "Quản lý người dùng",
      href: "/dashboard/users",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      title: "Thư viện dữ liệu",
      href: "/dashboard/library",
      icon: <Library className="mr-2 h-4 w-4" />,
    },
    {
      title: "Báo cáo thống kê",
      href: "/dashboard/reports",
      icon: <BarChart className="mr-2 h-4 w-4" />,
    },
    {
      title: "Cài đặt",
      href: "/dashboard/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader>
          <SheetTitle>Quân Nhu Lữ Đoàn</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 py-6">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center px-2 py-1 text-sm font-medium",
                pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start">
                {item.icon}
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
