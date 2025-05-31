import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SuppliesTable } from "@/components/supplies/supplies-table"
import { SuppliesFilter } from "@/components/supplies/supplies-filter"
import { SupplyAddButton } from "@/components/supplies/supply-add-button"

export const metadata: Metadata = {
  title: "Quản lý nguồn nhập | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Quản lý nguồn nhập quân nhu",
}

export default function SuppliesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Quản lý nguồn nhập" text="Quản lý thông tin nguồn nhập quân nhu">
        <SupplyAddButton />
      </DashboardHeader>
      <div className="space-y-4">
        <SuppliesFilter />
        <SuppliesTable />
      </div>
    </DashboardShell>
  )
}
