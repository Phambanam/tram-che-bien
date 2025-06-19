"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X, Calendar, Filter } from "lucide-react"
import { format } from "date-fns"
import { unitsApi, suppliesApi } from "@/lib/api-client"
import { Unit, ProductCategory } from "@/types"

interface SuppliesFilterProps {
  onFilterChange?: (filters: {
    unit?: string
    category?: string
    status?: string
    product?: string
    stationEntryFromDate?: string
    stationEntryToDate?: string
    createdFromDate?: string
    createdToDate?: string
    expiryFromDate?: string
    expiryToDate?: string
  }) => void
}

export function SuppliesFilter({ onFilterChange }: SuppliesFilterProps) {
  const [expanded, setExpanded] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filters, setFilters] = useState({
    unit: "all",
    category: "all",
    status: "all",
    product: "",
    stationEntryFromDate: format(new Date(), "yyyy-MM-dd"), // Default to today
    stationEntryToDate: format(new Date(), "yyyy-MM-dd"),
    createdFromDate: "",
    createdToDate: "",
    expiryFromDate: "",
    expiryToDate: "",
  })

  // Fetch units and categories on mount
  useEffect(() => {
    fetchUnits()
    fetchCategories()
  }, [])

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
      expiryFromDate: "",
      expiryToDate: "",
    }
    setFilters(resetFilters)
    onFilterChange?.({})
  }, [onFilterChange])

  // Auto search when station entry date changes
  useEffect(() => {
    if (filters.stationEntryFromDate || filters.stationEntryToDate) {
      handleSearch()
    }
  }, [filters.stationEntryFromDate, filters.stationEntryToDate])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Tìm kiếm nguồn nhập
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Primary filters - always visible */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Ngày nhập trạm (mặc định hôm nay) */}
            <div className="grid gap-2">
              <Label htmlFor="station-date">Ngày nhập trạm</Label>
              <Input 
                id="station-date" 
                type="date" 
                value={filters.stationEntryFromDate}
                onChange={(e) => {
                  handleFilterChange("stationEntryFromDate", e.target.value)
                  handleFilterChange("stationEntryToDate", e.target.value)
                }}
              />
            </div>

            {/* 2. Lọc theo đơn vị */}
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select value={filters.unit} onValueChange={(value) => handleFilterChange("unit", value)}>
                <SelectTrigger id="unit">
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

            {/* 4. Tất cả LTTP */}
            <div className="grid gap-2">
              <Label htmlFor="category">Phân loại LTTP</Label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger id="category">
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

            {/* 5. Tìm kiếm theo tên LTTP */}
            <div className="grid gap-2">
              <Label htmlFor="product">Tên LTTP</Label>
              <Input 
                id="product" 
                placeholder="Tìm theo tên LTTP" 
                value={filters.product}
                onChange={(e) => handleFilterChange("product", e.target.value)}
              />
            </div>
          </div>

          {expanded && (
            <>
              {/* 3. Lọc theo hạn sử dụng */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Hạn sử dụng
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-from-date" className="text-sm">Từ ngày</Label>
                    <Input 
                      id="expiry-from-date" 
                      type="date" 
                      value={filters.expiryFromDate}
                      onChange={(e) => handleFilterChange("expiryFromDate", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-to-date" className="text-sm">Đến ngày</Label>
                    <Input 
                      id="expiry-to-date" 
                      type="date" 
                      value={filters.expiryToDate}
                      onChange={(e) => handleFilterChange("expiryToDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Other filters */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                      <SelectItem value="received">Đã nhận</SelectItem>
                    </SelectContent>
                  </Select>
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
