"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, FileDown } from "lucide-react"
import { format } from "date-fns"
import { unitsApi, suppliesApi } from "@/lib/api-client"
import { Unit, ProductCategory } from "@/types"

interface SuppliesFilterProps {
  onFilterChange?: (filters: {
    unit?: string
    category?: string
    status?: string
    product?: string
    searchText?: string
    stationEntryDate?: string
    expiryFromDate?: string
    expiryToDate?: string
  }) => void
  onExportExcel?: () => void
}

export function SuppliesFilter({ onFilterChange, onExportExcel }: SuppliesFilterProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filters, setFilters] = useState({
    stationEntryDate: format(new Date(), "yyyy-MM-dd"), // Ngày nhập trạm mặc định hôm nay
    unit: "all", // Lọc theo đơn vị
    expiryFromDate: "", // Hạn sử dụng từ ngày
    expiryToDate: "", // Hạn sử dụng đến ngày
    category: "all", // Tất cả các LTTP
    searchText: "", // Tìm kiếm theo tên LTTP
    status: "all", // Trạng thái
  })

  // Fetch units and categories on mount
  useEffect(() => {
    fetchUnits()
    fetchCategories()
  }, [])

  // Auto trigger filter when stationEntryDate changes (default behavior for tracking today's entries)
  useEffect(() => {
    handleSearch()
  }, [filters.stationEntryDate])

  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getUnits()
      if (Array.isArray(response)) {
        setUnits(response)
      } else if (response && Array.isArray((response as any).data)) {
        setUnits((response as any).data)
      }
    } catch (error) {
      console.error("Error fetching units:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await suppliesApi.getFoodCategories()
      if (response && Array.isArray((response as any).data)) {
        setCategories((response as any).data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== "all" && value !== "") {
        if (key === "searchText") {
          // For search text, use it as product filter
          acc["product"] = value
        } else if (key === "stationEntryDate") {
          // For station entry date, use both from and to date
          acc["stationEntryFromDate"] = value
          acc["stationEntryToDate"] = value
        } else {
          acc[key] = value
        }
      }
      return acc
    }, {} as any)
    
    onFilterChange?.(activeFilters)
  }, [filters, onFilterChange])

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-end">
          {/* Ngày nhập trạm */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Ngày nhập trạm</label>
            <Input 
              type="date" 
              value={filters.stationEntryDate}
              onChange={(e) => handleFilterChange("stationEntryDate", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Lọc theo đơn vị */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Đơn vị</label>
            <Select value={filters.unit} onValueChange={(value) => handleFilterChange("unit", value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit._id} value={unit._id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hạn sử dụng từ */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Hạn sử dụng từ</label>
            <Input 
              type="date" 
              value={filters.expiryFromDate}
              onChange={(e) => handleFilterChange("expiryFromDate", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Hạn sử dụng đến */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Hạn sử dụng đến</label>
            <Input 
              type="date" 
              value={filters.expiryToDate}
              onChange={(e) => handleFilterChange("expiryToDate", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Phân loại LTTP */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tất cả các LTTP</label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả LTTP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả LTTP</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tìm kiếm */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tìm kiếm</label>
            <Input 
              placeholder="Tìm theo tên LTTP" 
              value={filters.searchText}
              onChange={(e) => handleFilterChange("searchText", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Trạng thái từ chối */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Từ chối</label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="received">Đã nhận</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút xuất Excel */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 invisible">Action</label>
            <Button 
              variant="outline" 
              onClick={onExportExcel}
              className="w-full flex items-center justify-center gap-2 text-sm"
            >
              <FileDown className="h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
