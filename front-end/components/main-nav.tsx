"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "TRANG CHỦ",
    href: "/dashboard",
  },
  {
    title: "GIỚI THIỆU",
    href: "/dashboard/gioi-thieu",
  },
  {
    title: "QUẢN LÝ NGUỒN NHẬP",
    href: "/dashboard/quan-ly-nguon-nhap",
  },
  {
    title: "TRẠM CHẾ BIẾN",
    href: "/dashboard/tram-che-bien",
  },
  {
    title: "BÁO CÁO THỰC ĐƠN",
    href: "/dashboard/bao-cao-thuc-don",
  },
  {
    title: "QUẢN LÝ NGUỒN XUẤT",
    href: "/dashboard/quan-ly-nguon-xuat",
  },
  {
    title: "HỖ TRỢ LẬP THỰC ĐƠN",
    href: "/dashboard/ho-tro-lap-thuc-don",
  },
  {
    title: "THƯ VIỆN DỮ LIỆU",
    href: "/dashboard/thu-vien-du-lieu",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full flex justify-center py-2 border-t border-b border-gray-300">
      <div className="max-w-6xl mx-auto px-4 flex justify-center flex-wrap gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-[#9fc5e8] text-black"
              : item.href === "/dashboard" && pathname === "/dashboard"
                ? "bg-[#9fc5e8] text-black"
                : item.href !== "/dashboard" && pathname.startsWith(item.href)
                  ? "bg-[#d0e0e3] text-black"
                  : "bg-[#d9d2e9] text-black hover:bg-[#b4a7d6]",
          )}
        >
          {item.title}
        </Link>
      ))}
      </div>
    </nav>
  )
}
