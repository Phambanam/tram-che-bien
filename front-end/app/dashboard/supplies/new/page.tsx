import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SupplyForm } from "@/components/supplies/supply-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Thêm mới nguồn nhập | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Thêm mới thông tin nguồn nhập quân nhu",
}

export default function NewSupplyPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Thêm mới nguồn nhập" text="Thêm mới thông tin nguồn nhập quân nhu">
        <Link href="/dashboard/supplies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-4">
        <SupplyForm />
      </div>
    </DashboardShell>
  )
}
