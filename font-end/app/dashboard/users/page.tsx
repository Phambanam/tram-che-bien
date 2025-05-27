import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { UsersTable } from "@/components/users/users-table"

export const metadata: Metadata = {
  title: "Quản lý người dùng | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Quản lý người dùng trong hệ thống",
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  // Kiểm tra quyền truy cập
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Quản lý người dùng" text="Quản lý thông tin người dùng trong hệ thống" />
      <div className="space-y-4">
        <UsersTable />
      </div>
    </DashboardShell>
  )
}
