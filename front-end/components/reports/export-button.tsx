"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ExportButtonProps {
  data: any[]
  filename: string
  type: "excel" | "pdf" | "csv"
}

export function ExportButton({ data, filename, type }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsLoading(true)

    try {
      if (type === "excel" || type === "csv") {
        // For Excel/CSV export
        let csvContent = ""

        // Get headers
        if (data.length > 0) {
          const headers = Object.keys(data[0])
          csvContent += headers.join(",") + "\n"

          // Add data rows
          data.forEach((item) => {
            const row = headers.map((header) => {
              const cell = item[header]
              // Handle strings with commas by wrapping in quotes
              return typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
            })
            csvContent += row.join(",") + "\n"
          })
        }

        // Create blob and download
        const blob = new Blob([csvContent], { type: type === "excel" ? "application/vnd.ms-excel" : "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}.${type === "excel" ? "xlsx" : "csv"}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Xuất dữ liệu thành công",
          description: `Đã xuất dữ liệu sang ${type === "excel" ? "Excel" : "CSV"}`,
        })
      } else if (type === "pdf") {
        // For PDF export (would typically use a library like jsPDF)
        toast({
          title: "Chức năng đang phát triển",
          description: "Xuất PDF sẽ được hỗ trợ trong phiên bản tới",
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        variant: "destructive",
        title: "Xuất dữ liệu thất bại",
        description: "Đã xảy ra lỗi khi xuất dữ liệu",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
      <Download className="mr-2 h-4 w-4" />
      Xuất {type === "excel" ? "Excel" : type === "pdf" ? "PDF" : "CSV"}
    </Button>
  )
}
