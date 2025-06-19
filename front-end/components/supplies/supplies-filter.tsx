"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X, Calendar, Filter } from "lucide-react"

interface SuppliesFilterProps {
  onFilterChange?: (filters: {
    unit?: string
    category?: string
    status?: string
    product?: string
    fromDate?: string
    toDate?: string
    stationEntryFromDate?: string
    stationEntryToDate?: string
    createdFromDate?: string
    createdToDate?: string
  }) => void
}

export function SuppliesFilter({ onFilterChange }: SuppliesFilterProps) {
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState({
    unit: "all",
    category: "all",
    status: "all",
    product: "",
    stationEntryFromDate: "",
    stationEntryToDate: "",
    createdFromDate: "",
    createdToDate: "",
  })

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== "all" && value !== "") {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    onFilterChange?.(activeFilters)
  }, [filters, onFilterChange])

  const handleReset = useCallback(() => {
    const resetFilters = {
      unit: "all",
      category: "all",
      status: "all",
      product: "",
      stationEntryFromDate: "",
      stationEntryToDate: "",
      createdFromDate: "",
      createdToDate: "",
    }
    setFilters(resetFilters)
    onFilterChange?.({})
  }, [onFilterChange])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Tìm kiếm và lọc nguồn nhập
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select value={filters.unit} onValueChange={(value) => handleFilterChange("unit", value)}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Tất cả đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn vị</SelectItem>
                  <SelectItem value="tieu-doan-1">Tiểu đoàn 1</SelectItem>
                  <SelectItem value="tieu-doan-2">Tiểu đoàn 2</SelectItem>
                  <SelectItem value="tieu-doan-3">Tiểu đoàn 3</SelectItem>
                  <SelectItem value="lu-doan-bo">Lữ đoàn bộ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Phân loại</Label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Tất cả phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phân loại</SelectItem>
                  <SelectItem value="rau">Rau</SelectItem>
                  <SelectItem value="gia-suc">Gia súc</SelectItem>
                  <SelectItem value="gia-cam">Gia cầm</SelectItem>
                  <SelectItem value="hai-san">Hải sản</SelectItem>
                  <SelectItem value="gia-vi">Gia vị</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                  <SelectItem value="approved">Đã phê duyệt</SelectItem>
                  <SelectItem value="rejected">Đã từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {expanded && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="product">Sản phẩm</Label>
                  <Input 
                    id="product" 
                    placeholder="Nhập tên sản phẩm" 
                    value={filters.product}
                    onChange={(e) => handleFilterChange("product", e.target.value)}
                  />
                </div>
              </div>

              {/* Filter theo ngày nhập trạm */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày nhập trạm
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="station-entry-from-date" className="text-sm">Từ ngày</Label>
                    <Input 
                      id="station-entry-from-date" 
                      type="date" 
                      value={filters.stationEntryFromDate}
                      onChange={(e) => handleFilterChange("stationEntryFromDate", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="station-entry-to-date" className="text-sm">Đến ngày</Label>
                    <Input 
                      id="station-entry-to-date" 
                      type="date" 
                      value={filters.stationEntryToDate}
                      onChange={(e) => handleFilterChange("stationEntryToDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Filter theo ngày tạo */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày tạo
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="created-from-date" className="text-sm">Từ ngày</Label>
                    <Input 
                      id="created-from-date" 
                      type="date" 
                      value={filters.createdFromDate}
                      onChange={(e) => handleFilterChange("createdFromDate", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="created-to-date" className="text-sm">Đến ngày</Label>
                    <Input 
                      id="created-to-date" 
                      type="date" 
                      value={filters.createdToDate}
                      onChange={(e) => handleFilterChange("createdToDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Thu gọn
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Mở rộng
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Đặt lại
          </Button>
        </div>
        <Button size="sm" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Áp dụng lọc
        </Button>
      </CardFooter>
    </Card>
  )
}
