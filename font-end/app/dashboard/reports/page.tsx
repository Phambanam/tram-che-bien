import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportByUnit } from "@/components/reports/report-by-unit"
import { ReportByCategory } from "@/components/reports/report-by-category"
import { DetailedReport } from "@/components/reports/detailed-report"

export const metadata: Metadata = {
  title: "Báo cáo thống kê | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Báo cáo thống kê nguồn nhập quân nhu",
}

export default function ReportsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Báo cáo thống kê" text="Xem báo cáo thống kê nguồn nhập quân nhu" />
      <Tabs defaultValue="by-unit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-unit">Theo đơn vị</TabsTrigger>
          <TabsTrigger value="by-category">Theo phân loại</TabsTrigger>
          <TabsTrigger value="detailed">Chi tiết</TabsTrigger>
        </TabsList>
        <TabsContent value="by-unit" className="space-y-4">
          <ReportByUnit />
        </TabsContent>
        <TabsContent value="by-category" className="space-y-4">
          <ReportByCategory />
        </TabsContent>
        <TabsContent value="detailed" className="space-y-4">
          <DetailedReport />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
