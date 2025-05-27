import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnitsTable } from "@/components/library/units-table"
import { CategoriesTable } from "@/components/library/categories-table"
import { ProductsTable } from "@/components/library/products-table"

export const metadata: Metadata = {
  title: "Thư viện dữ liệu | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Quản lý thư viện dữ liệu trong hệ thống",
}

export default async function LibraryPage() {
  const session = await getServerSession(authOptions)

  // Kiểm tra quyền truy cập
  if (!session || (session.user.role !== "admin" && session.user.role !== "brigadeAssistant")) {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Thư viện dữ liệu" text="Quản lý thư viện dữ liệu trong hệ thống" />
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Đơn vị</TabsTrigger>
          <TabsTrigger value="categories">Phân loại</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
        </TabsList>
        <TabsContent value="units" className="space-y-4">
          <UnitsTable />
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <CategoriesTable />
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <ProductsTable />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
