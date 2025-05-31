"use client"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { UsersTable } from "@/components/users/users-table"
import { User } from "@/lib/api-client"
import { useEffect } from  "react"
import { useRouter } from "next/navigation"
// export const metadata: Metadata = {
//   title: "Quản lý người dùng | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
//   description: "Quản lý người dùng trong hệ thống",
// }

export default function UsersPage() {
  
    const router = useRouter();

    useEffect(() => {
      const userJson = localStorage.getItem("user");
      if (!userJson) {
        router.push("/login");
      }
      const user: User = userJson? JSON.parse(userJson): null;
      if (user && user.role !== "admin") {
        router.push("/dashboard")
      }
    }, [router]);


  return (
    <DashboardShell>
      <div className="flex flex-col gap-3">
        <DashboardHeader heading="Quản lý người dùng" text="Quản lý thông tin người dùng trong hệ thống" />
        <UsersTable />
      </div>
    </DashboardShell>
  )
}
