"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart3, TrendingUp, TrendingDown, FileDown, RefreshCw, Calendar, AlertTriangle, Calculator } from "lucide-react"
import { format, getWeek, getYear } from "date-fns"
import { vi } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { supplyOutputsApi, unitsApi } from "@/lib/api-client"

interface ComparisonData {
  date: string
  unit: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
  }
  plannedQuantity: number
  actualQuantity: number
  variance: number
  variancePercent: number | null
  hasPlanned: boolean
  hasActual: boolean
}

interface ComparisonSummary {
  totalItems: number
  withPlanned: number
  withActual: number
  withBoth: number
}

interface Unit {
  _id: string
  name: string
}

export function PlannedVsActualContent() {
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeek(new Date(), { locale: vi }))
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()))
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [summary, setSummary] = useState<ComparisonSummary | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { toast } = useToast()

  // Fetch units for filter
  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getUnits()
      const unitsData = Array.isArray(response) ? response : (response as any).data || []
      setUnits(unitsData)
    } catch (error) {
      console.error("Error fetching units:", error)
    }
  }

  // Fetch comparison data
  const fetchComparisonData = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        week: selectedWeek,
        year: selectedYear
      }
      
      if (selectedUnit !== "all") {
        params.unitId = selectedUnit
      }

      const response = await supplyOutputsApi.getPlannedVsActual(params)
      
      if (response.success) {
        setComparisonData(response.data || [])
        setSummary(response.summary || null)
      } else {
        setComparisonData([])
        setSummary(null)
        toast({
          title: "Thông báo",
          description: "Không có dữ liệu so sánh cho tuần này",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error fetching comparison data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu so sánh",
        variant: "destructive",
      })
      setComparisonData([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    fetchComparisonData()
  }, [selectedWeek, selectedYear, selectedUnit])

  // Group data by date
  const groupDataByDate = () => {
    const grouped: { [date: string]: ComparisonData[] } = {}
    
    comparisonData.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = []
      }
      grouped[item.date].push(item)
    })
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }

  const groupedData = groupDataByDate()

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      totalPlanned: 0,
      totalActual: 0,
      totalVariance: 0,
      averageVariancePercent: 0
    }

    if (comparisonData.length > 0) {
      totals.totalPlanned = comparisonData.reduce((sum, item) => sum + item.plannedQuantity, 0)
      totals.totalActual = comparisonData.reduce((sum, item) => sum + item.actualQuantity, 0)
      totals.totalVariance = totals.totalActual - totals.totalPlanned
      
      const validVariances = comparisonData.filter(item => item.variancePercent !== null)
      if (validVariances.length > 0) {
        totals.averageVariancePercent = validVariances.reduce((sum, item) => sum + (item.variancePercent || 0), 0) / validVariances.length
      }
    }

    return totals
  }

  const totals = calculateTotals()

  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">SO SÁNH KẾ HOẠCH VÀ THỰC TẾ XUẤT</h2>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Tuần</Label>
                <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        Tuần {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Năm</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Đơn vị</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả đơn vị</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={fetchComparisonData}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tải lại
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng mục</p>
                    <p className="text-2xl font-bold">{summary.totalItems}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có kế hoạch</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.withPlanned}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có thực tế</p>
                    <p className="text-2xl font-bold text-green-600">{summary.withActual}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có cả hai</p>
                    <p className="text-2xl font-bold text-purple-600">{summary.withBoth}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Totals Summary */}
        {comparisonData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tổng kết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng kế hoạch</p>
                  <p className="text-xl font-bold text-blue-600">{totals.totalPlanned.toFixed(2)} kg</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng thực tế</p>
                  <p className="text-xl font-bold text-green-600">{totals.totalActual.toFixed(2)} kg</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${totals.totalVariance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600">Chênh lệch</p>
                  <p className={`text-xl font-bold ${totals.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.totalVariance >= 0 ? '+' : ''}{totals.totalVariance.toFixed(2)} kg
                  </p>
                </div>
                <div className={`text-center p-4 rounded-lg ${totals.averageVariancePercent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600">% Chênh lệch TB</p>
                  <p className={`text-xl font-bold ${totals.averageVariancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.averageVariancePercent >= 0 ? '+' : ''}{totals.averageVariancePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Comparison Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                So sánh chi tiết - Tuần {selectedWeek}/{selectedYear}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b45f06] mx-auto mb-4"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : comparisonData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                  <p className="text-gray-600">
                    Chưa có dữ liệu so sánh cho tuần {selectedWeek}/{selectedYear}.
                    <br />
                    Vui lòng tạo kế hoạch xuất từ trang "Quản lý nguồn xuất" trước.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">STT</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-center">Kế hoạch (kg)</TableHead>
                      <TableHead className="text-center">Thực tế (kg)</TableHead>
                      <TableHead className="text-center">Chênh lệch (kg)</TableHead>
                      <TableHead className="text-center">Chênh lệch (%)</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.map(([date, dateItems], dateIndex) => (
                      <React.Fragment key={date}>
                        {/* Date Header */}
                        <TableRow className="bg-blue-100 font-bold">
                          <TableCell colSpan={9} className="text-center text-blue-800">
                            📅 {format(new Date(date), "EEEE, dd/MM/yyyy", { locale: vi })} ({dateItems.length} mục)
                          </TableCell>
                        </TableRow>
                        
                        {/* Date Items */}
                        {dateItems.map((item, itemIndex) => (
                          <TableRow key={`${item.date}-${item.unit.id}-${item.product.id}`}>
                            <TableCell>{itemIndex + 1}</TableCell>
                            <TableCell>{format(new Date(item.date), "dd/MM", { locale: vi })}</TableCell>
                            <TableCell>{item.unit.name}</TableCell>
                            <TableCell className="font-medium">{item.product.name}</TableCell>
                            <TableCell className="text-center bg-blue-50">
                              {item.plannedQuantity.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center bg-green-50">
                              {item.actualQuantity.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-center font-medium ${
                              item.variance >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                            }`}>
                              {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-center font-medium ${
                              (item.variancePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.variancePercent !== null ? (
                                `${item.variancePercent >= 0 ? '+' : ''}${item.variancePercent.toFixed(1)}%`
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                {item.hasPlanned && (
                                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                    KH
                                  </Badge>
                                )}
                                {item.hasActual && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                    TT
                                  </Badge>
                                )}
                                {!item.hasPlanned && !item.hasActual && (
                                  <Badge variant="outline" className="text-xs border-gray-500 text-gray-700">
                                    Trống
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 