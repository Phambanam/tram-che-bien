import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SuppliesTable } from "@/components/supplies/supplies-table"
import { SuppliesFilter } from "@/components/supplies/supplies-filter"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Quản lý nguồn nhập | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Quản lý nguồn nhập quân nhu",
}

export default async function SuppliesPage() {
  const session = await getServerSession(authOptions)

  // Kiểm tra quyền thêm mới nguồn nhập
  const canAddSupply = session?.user.role === "admin" || session?.user.role === "unitAssistant"

  return (
    <DashboardShell>
      <DashboardHeader heading="Quản lý nguồn nhập" text="Quản lý thông tin nguồn nhập quân nhu">
        {canAddSupply && (
          <Link href="/dashboard/supplies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </Link>
        )}
      </DashboardHeader>
      <div className="space-y-4">
        <SuppliesFilter />
        <SuppliesTable />
      </div>
    </DashboardShell>
  )
}
