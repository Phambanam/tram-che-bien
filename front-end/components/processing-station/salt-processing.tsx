"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Scale, 
  Leaf,
  AlertTriangle,
  Calendar,
  Package,
  Save,
  RotateCcw,
  Calculator,
  Search
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, getWeek, getYear, getMonth } from 'date-fns'
import { vi } from 'date-fns/locale'
import { api } from '../../lib/api-client'

// Main Salt Processing Component
export default function SaltProcessing() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [editingData, setEditingData] = useState({
    vegetablesInput: 0,
    saltInput: 0,
    saltOutput: 0,
    byProductQuantity: 0,
    byProductPrice: 2000,
    vegetablesPrice: 8000,
    saltPrice: 12000,
    otherCosts: 0,
    note: ''
  })

  // Weekly tracking states
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [currentWeek, setCurrentWeek] = useState(getWeek(new Date()))
  const [currentYear, setCurrentYear] = useState(getYear(new Date()))

  // Monthly summary states
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(getMonth(new Date()) + 1)
  const [monthlyYear, setMonthlyYear] = useState(getYear(new Date()))
  const [monthCount, setMonthCount] = useState(6)

  // Detection test states
  const [detectionDate, setDetectionDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [detectionResults, setDetectionResults] = useState<any>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  useEffect(() => {
    loadWeeklyData()
  }, [currentWeek, currentYear])

  useEffect(() => {
    loadMonthlyData()
  }, [currentMonth, monthlyYear, monthCount])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you'd load actual processing station data
      // For now, we'll simulate data
      const fallbackData = {
        vegetablesInput: 200,
        saltInput: 140,
        saltOutput: 130,
        byProductQuantity: 15,
        byProductPrice: 2000,
        vegetablesPrice: 8000,
        saltPrice: 12000,
        otherCosts: 50000,
        note: ''
      }
      setEditingData(fallbackData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Không thể tải dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWeeklyData = async () => {
    try {
      const response = await api.saltCalculation.getWeeklySaltTracking({
        week: currentWeek,
        year: currentYear
      })
      setWeeklyData(response.data)
    } catch (error) {
      console.error('Error loading weekly data:', error)
    }
  }

  const loadMonthlyData = async () => {
    try {
      const response = await api.saltCalculation.getMonthlySaltSummary({
        month: currentMonth,
        year: monthlyYear,
        monthCount
      })
      setMonthlyData(response.data)
    } catch (error) {
      console.error('Error loading monthly data:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // In a real app, you'd save to the backend
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving data:', error)
      setError('Không thể lưu dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: number | string) => {
    setEditingData(prev => ({ ...prev, [field]: value }))
  }

  const resetToCurrentWeek = () => {
    const now = new Date()
    setCurrentWeek(getWeek(now))
    setCurrentYear(getYear(now))
  }

  const resetToCurrentMonth = () => {
    const now = new Date()
    setCurrentMonth(getMonth(now) + 1)
    setMonthlyYear(getYear(now))
  }

  const runDetectionTest = async () => {
    setIsDetecting(true)
    try {
      const response = await api.saltCalculation.getSaltRequirements({
        date: detectionDate
      })
      setDetectionResults(response.data)
    } catch (error) {
      console.error('Error running detection test:', error)
      setDetectionResults({ error: 'Không thể chạy kiểm tra phát hiện' })
    } finally {
      setIsDetecting(false)
    }
  }

  // Calculate financial metrics
  const calculateFinancials = (data: typeof editingData) => {
    const saltRevenue = data.saltOutput * data.saltPrice
    const byProductRevenue = data.byProductQuantity * data.byProductPrice
    const totalRevenue = saltRevenue + byProductRevenue
    
    const vegetablesCosts = data.vegetablesInput * data.vegetablesPrice
    const totalCosts = vegetablesCosts + data.otherCosts
    
    const profit = totalRevenue - totalCosts
    const efficiency = data.vegetablesInput > 0 ? (data.saltInput / data.vegetablesInput * 100) : 0
    
    return {
      saltRevenue,
      byProductRevenue,
      totalRevenue,
      vegetablesCosts,
      totalCosts,
      profit,
      efficiency
    }
  }

  const financials = calculateFinancials(editingData)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Chế biến muối nén (Dưa muối)</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Daily Processing Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sản xuất hàng ngày - {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: vi })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rau củ quả đầu vào (kg)</label>
              <Input
                type="number"
                value={editingData.vegetablesInput}
                onChange={(e) => handleInputChange('vegetablesInput', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="Nhập số kg rau củ quả"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Dưa muối thu được (kg)</label>
              <Input
                type="number"
                value={editingData.saltInput}
                onChange={(e) => handleInputChange('saltInput', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="Nhập số kg dưa muối"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Dưa muối xuất ra (kg)</label>
              <Input
                type="number"
                value={editingData.saltOutput}
                onChange={(e) => handleInputChange('saltOutput', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="Nhập số kg xuất"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phụ phẩm (kg)</label>
              <Input
                type="number"
                value={editingData.byProductQuantity}
                onChange={(e) => handleInputChange('byProductQuantity', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="Nhập số kg phụ phẩm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Chi phí khác (VNĐ)</label>
              <Input
                type="number"
                value={editingData.otherCosts}
                onChange={(e) => handleInputChange('otherCosts', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="Nhập chi phí khác"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú</label>
            <Input
              value={editingData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              disabled={!isEditing}
              placeholder="Nhập ghi chú"
            />
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    loadData()
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu dưa muối</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financials.saltRevenue.toLocaleString()} VNĐ</div>
            <p className="text-xs text-muted-foreground">
              {editingData.saltOutput} kg × {editingData.saltPrice.toLocaleString()} VNĐ/kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi phí rau củ quả</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financials.vegetablesCosts.toLocaleString()} VNĐ</div>
            <p className="text-xs text-muted-foreground">
              {editingData.vegetablesInput} kg × {editingData.vegetablesPrice.toLocaleString()} VNĐ/kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
            {financials.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financials.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financials.profit.toLocaleString()} VNĐ
            </div>
            <Badge variant={financials.profit >= 0 ? "default" : "destructive"}>
              {financials.profit >= 0 ? 'Lãi' : 'Lỗ'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu suất chuyển đổi</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financials.efficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Rau củ quả → Dưa muối
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>BẢNG THEO DÕI CHẾ BIẾN DƯA MUỐI THEO TUẦN</span>
            <div className="flex gap-2">
              <Input
                type="number"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(parseInt(e.target.value) || 1)}
                className="w-20"
                min={1}
                max={53}
                placeholder="Tuần"
              />
              <Input
                type="number"
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-24"
                placeholder="Năm"
              />
              <Button onClick={resetToCurrentWeek} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50">Ngày</th>
                      <th className="border p-2 bg-gray-50">Rau củ quả (kg)</th>
                      <th className="border p-2 bg-blue-50" colSpan={2}>THU (VNĐ)</th>
                      <th className="border p-2 bg-red-50" colSpan={3}>CHI (VNĐ)</th>
                      <th className="border p-2 bg-green-50">Lãi/Lỗ</th>
                    </tr>
                    <tr>
                      <th className="border p-2 bg-gray-50"></th>
                      <th className="border p-2 bg-gray-50"></th>
                      <th className="border p-2 bg-blue-50">Dưa muối</th>
                      <th className="border p-2 bg-blue-50">Phụ phẩm</th>
                      <th className="border p-2 bg-red-50">Rau củ quả</th>
                      <th className="border p-2 bg-red-50">Muối & gia vị</th>
                      <th className="border p-2 bg-red-50">Khác</th>
                      <th className="border p-2 bg-green-50">VNĐ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.dailyData?.map((day: any, index: number) => {
                      const saltRevenue = day.saltOutput * day.saltPrice
                      const byProductRevenue = day.byProductQuantity * day.byProductPrice
                      const vegetablesCosts = day.vegetablesInput * day.vegetablesPrice
                      const saltCosts = day.saltInput * 1000 // Estimated salt/spice cost
                      const totalRevenue = saltRevenue + byProductRevenue
                      const totalCosts = vegetablesCosts + saltCosts + day.otherCosts
                      const profit = totalRevenue - totalCosts
                      
                      return (
                        <tr key={index}>
                          <td className="border p-2 font-medium">{day.dayOfWeek}</td>
                          <td className="border p-2 text-center">{day.vegetablesInput}</td>
                          <td className="border p-2 text-right">{saltRevenue.toLocaleString()}</td>
                          <td className="border p-2 text-right">{byProductRevenue.toLocaleString()}</td>
                          <td className="border p-2 text-right">{vegetablesCosts.toLocaleString()}</td>
                          <td className="border p-2 text-right">{saltCosts.toLocaleString()}</td>
                          <td className="border p-2 text-right">{day.otherCosts.toLocaleString()}</td>
                          <td className={`border p-2 text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Weekly Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Tổng doanh thu</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {weeklyData.dailyData?.reduce((sum: number, day: any) => 
                        sum + (day.saltOutput * day.saltPrice) + (day.byProductQuantity * day.byProductPrice), 0
                      ).toLocaleString()} VNĐ
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Tổng chi phí</div>
                    <div className="text-2xl font-bold text-red-600">
                      {weeklyData.dailyData?.reduce((sum: number, day: any) => 
                        sum + (day.vegetablesInput * day.vegetablesPrice) + (day.saltInput * 1000) + day.otherCosts, 0
                      ).toLocaleString()} VNĐ
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Lãi/Lỗ tuần</div>
                    <div className="text-2xl font-bold text-green-600">
                      {weeklyData.dailyData?.reduce((sum: number, day: any) => {
                        const revenue = (day.saltOutput * day.saltPrice) + (day.byProductQuantity * day.byProductPrice)
                        const costs = (day.vegetablesInput * day.vegetablesPrice) + (day.saltInput * 1000) + day.otherCosts
                        return sum + (revenue - costs)
                      }, 0).toLocaleString()} VNĐ
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Hiệu suất TB</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {weeklyData.totals?.averageConversionRate?.toFixed(1) || 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải dữ liệu tuần...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>LÀM DƯA MUỐI - TỔNG HỢP THEO THÁNG</span>
            <div className="flex gap-2">
              <Input
                type="number"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value) || 1)}
                className="w-20"
                min={1}
                max={12}
                placeholder="Tháng"
              />
              <Input
                type="number"
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-24"
                placeholder="Năm"
              />
              <select
                value={monthCount}
                onChange={(e) => setMonthCount(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                <option value={3}>3 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng</option>
              </select>
              <Button onClick={resetToCurrentMonth} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50" rowSpan={2}>Tháng/Năm</th>
                    <th className="border p-2 bg-green-50" colSpan={3}>DƯA MUỐI</th>
                    <th className="border p-2 bg-yellow-50" colSpan={3}>RAU CỦ QUẢ</th>
                    <th className="border p-2 bg-blue-50" rowSpan={2}>Hiệu suất (%)</th>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-green-50">Sản xuất (kg)</th>
                    <th className="border p-2 bg-green-50">Xuất (kg)</th>
                    <th className="border p-2 bg-green-50">Tồn (kg)</th>
                    <th className="border p-2 bg-yellow-50">Nhập (kg)</th>
                    <th className="border p-2 bg-yellow-50">Giá (VNĐ/kg)</th>
                    <th className="border p-2 bg-yellow-50">Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.monthlySummaries?.map((month: any, index: number) => (
                    <tr key={index}>
                      <td className="border p-2 font-medium">{month.month}</td>
                      <td className="border p-2 text-center">{month.totalSaltCollected}</td>
                      <td className="border p-2 text-center">{month.totalSaltOutput}</td>
                      <td className="border p-2 text-center">{month.totalSaltRemaining}</td>
                      <td className="border p-2 text-center">{month.totalVegetablesInput}</td>
                      <td className="border p-2 text-right">8,000</td>
                      <td className="border p-2 text-right">{(month.totalVegetablesInput * 8000).toLocaleString()}</td>
                      <td className="border p-2 text-center font-bold text-blue-600">{month.processingEfficiency}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải dữ liệu tháng...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Kiểm tra phát hiện dưa muối trong thực đơn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={detectionDate}
              onChange={(e) => setDetectionDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={runDetectionTest} disabled={isDetecting}>
              <Search className="h-4 w-4 mr-2" />
              {isDetecting ? 'Đang kiểm tra...' : 'Chạy kiểm tra'}
            </Button>
          </div>

          {detectionResults && (
            <div className="space-y-4">
              {detectionResults.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{detectionResults.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Món có dưa muối</div>
                        <div className="text-2xl font-bold">{detectionResults.dishesUsingSalt?.length || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Tổng dưa muối cần</div>
                        <div className="text-2xl font-bold">{detectionResults.totalSaltRequired?.toFixed(1) || 0} kg</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Rau củ quả cần</div>
                        <div className="text-2xl font-bold">{detectionResults.summary?.recommendedVegetablesInput?.toFixed(1) || 0} kg</div>
                      </CardContent>
                    </Card>
                  </div>

                  {detectionResults.dishesUsingSalt?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Món ăn sử dụng dưa muối:</h4>
                      <div className="space-y-2">
                        {detectionResults.dishesUsingSalt.map((dish: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-3">
                              <div className="font-medium">{dish.dishName}</div>
                              <div className="text-sm text-muted-foreground">Bữa: {dish.mealType}</div>
                              <div className="text-sm">
                                Nguyên liệu dưa muối: {dish.saltIngredients?.map((ing: any) => ing.lttpName).join(', ')}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {detectionResults.units?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Phân bổ theo đơn vị:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                          <thead>
                            <tr>
                              <th className="border p-2 bg-gray-50">Đơn vị</th>
                              <th className="border p-2 bg-gray-50">Quân số</th>
                              <th className="border p-2 bg-gray-50">Dưa muối cần (kg)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detectionResults.units.map((unit: any, index: number) => (
                              <tr key={index}>
                                <td className="border p-2">{unit.unitName}</td>
                                <td className="border p-2 text-center">{unit.personnel}</td>
                                <td className="border p-2 text-center">{unit.totalSaltRequired.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 