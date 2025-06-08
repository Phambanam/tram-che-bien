"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Package, Utensils, Fish, Beef, Wheat, Droplets } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { suppliesApi, supplyOutputsApi, unitsApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SupplySource, Unit } from "@/types"

interface WeeklyTofuData {
  id: string
  week: string // "2024-W01" format
  startDate: string
  endDate: string
  dailyData: DailyTofuData[]
  weeklyTotal: TofuSummary
}

interface DailyTofuData {
  date: string
  dayOfWeek: string // "Thứ 2", "Thứ 3", etc.
  soybeanInput: number // Đậu hạt nhập
  soybeanOutput: number // Đậu hạt xuất
  soybeanRemaining: number // Đậu hạt tồn
  tofuOutputToUnits: TofuOutputToUnit[] // Đậu phụ xuất đơn vị
  tofuOutputToOthers: string // Đậu phụ xuất khác (nhập tay)
  tofuRemaining: number // Đậu phụ tồn
  note: string // Ghi chú
}

interface TofuOutputToUnit {
  unitId: string
  unitName: string
  quantity: number
}

interface TofuSummary {
  totalSoybeanInput: number
  totalSoybeanOutput: number
  totalSoybeanRemaining: number
  totalTofuOutputToUnits: number
  totalTofuOutputToOthers: string
  totalTofuRemaining: number
}

interface ProcessingItem {
  id: string
  date: string
  inputQuantity: number
  outputQuantity: number
  remainingQuantity: number
  status: "processing" | "completed" | "expired"
  note?: string
}

interface InventoryItem {
  productName: string
  inputQuantity: number
  outputQuantity: number
  remainingQuantity: number
  lastUpdated: string
}

export function ProcessingStationContent() {
  const [activeSection, setActiveSection] = useState("tofu")
  const [tofuData, setTofuData] = useState<ProcessingItem[]>([])
  const [weeklyTofuData, setWeeklyTofuData] = useState<WeeklyTofuData[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [livestockData, setLivestockData] = useState<any[]>([])
  const [isLoadingLivestock, setIsLoadingLivestock] = useState(false)
  const [soybeanData, setSoybeanData] = useState<any[]>([])
  const [isLoadingSoybean, setIsLoadingSoybean] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Approval state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [supplyToApprove, setSupplyToApprove] = useState<SupplySource | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalData, setApprovalData] = useState({
    stationEntryDate: "",
    requestedQuantity: 0,
    actualQuantity: 0,
    unitPrice: 0,
    expiryDate: "",
        note: "",
  })

  // Processing update state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [dayToUpdate, setDayToUpdate] = useState<DailyTofuData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateData, setUpdateData] = useState({
    soybeanInput: 0,
    soybeanOutput: 0,
    tofuOutputToUnits: [] as TofuOutputToUnit[],
    tofuOutputToOthers: "",
        note: "",
  })

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }

  // Get day name in Vietnamese
  const getDayName = (dayIndex: number) => {
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    return days[dayIndex]
  }

  // Generate sample weekly data
  const generateSampleWeeklyData = (): WeeklyTofuData[] => {
    const weekDates = getCurrentWeekDates()
    const startDate = weekDates[0]
    const endDate = weekDates[6]
    
    const dailyData: DailyTofuData[] = weekDates.map((date, index) => ({
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek: getDayName(date.getDay()),
      soybeanInput: index < 5 ? 20 + Math.floor(Math.random() * 10) : 0, // Weekdays only
      soybeanOutput: index < 5 ? 15 + Math.floor(Math.random() * 8) : 0,
      soybeanRemaining: 0, // Will be calculated
      tofuOutputToUnits: index < 5 ? [
        { unitId: "unit1", unitName: "Tiểu đoàn 1", quantity: 10 + Math.floor(Math.random() * 5) },
        { unitId: "unit2", unitName: "Tiểu đoàn 2", quantity: 8 + Math.floor(Math.random() * 4) }
      ] : [],
      tofuOutputToOthers: index < 5 ? `Đơn vị khác: ${2 + Math.floor(Math.random() * 3)}kg` : "",
      tofuRemaining: 0, // Will be calculated
      note: index < 5 ? `Ghi chú ngày ${getDayName(date.getDay())}` : ""
    }))

    // Calculate remaining quantities
    dailyData.forEach(day => {
      day.soybeanRemaining = day.soybeanInput - day.soybeanOutput
      const totalTofuToUnits = day.tofuOutputToUnits.reduce((sum, unit) => sum + unit.quantity, 0)
      day.tofuRemaining = day.soybeanOutput - totalTofuToUnits // Assuming 1:1 conversion
    })

    const weeklyTotal: TofuSummary = {
      totalSoybeanInput: dailyData.reduce((sum, day) => sum + day.soybeanInput, 0),
      totalSoybeanOutput: dailyData.reduce((sum, day) => sum + day.soybeanOutput, 0),
      totalSoybeanRemaining: dailyData.reduce((sum, day) => sum + day.soybeanRemaining, 0),
      totalTofuOutputToUnits: dailyData.reduce((sum, day) => 
        sum + day.tofuOutputToUnits.reduce((unitSum, unit) => unitSum + unit.quantity, 0), 0),
      totalTofuOutputToOthers: "Tổng các đơn vị khác trong tuần",
      totalTofuRemaining: dailyData.reduce((sum, day) => sum + day.tofuRemaining, 0)
    }

    return [{
      id: "week-current",
      week: format(startDate, "yyyy-'W'ww"),
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      dailyData,
      weeklyTotal
    }]
  }

  // Fetch livestock data from supplies API
  const fetchLivestockData = async (date: Date) => {
    try {
      setIsLoadingLivestock(true)
      
      // Format date for API filter
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get supplies data filtered for meat/livestock and date
      const filters = {
        stationEntryFromDate: dateStr,
        stationEntryToDate: dateStr,
        category: "thịt", // Filter for meat category
        status: "approved" // Only approved supplies
      }
      
      const suppliesResponse = await suppliesApi.getSupplies(filters)
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []
      
      // Filter for pork/livestock specifically
      const porkSupplies = supplies.filter((supply: any) => 
        supply.product && supply.product.name && (
          supply.product.name.toLowerCase().includes("lợn") ||
          supply.product.name.toLowerCase().includes("heo") ||
          supply.product.name.toLowerCase().includes("thịt")
        )
      )
      
      setLivestockData(porkSupplies)
      
      console.log("Livestock data loaded:", porkSupplies)
      
    } catch (error) {
      console.error("Error fetching livestock data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu thịt lợn",
        variant: "destructive",
      })
      setLivestockData([])
    } finally {
      setIsLoadingLivestock(false)
    }
  }

  // Fetch soybean data from supplies API for tofu processing
  const fetchSoybeanDataForWeek = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoadingSoybean(true)
      
      // Format dates for API filter
      const startDateStr = format(startDate, "yyyy-MM-dd")
      const endDateStr = format(endDate, "yyyy-MM-dd")
      
      // Get supplies data filtered for soybean and date range
      const filters = {
        stationEntryFromDate: startDateStr,
        stationEntryToDate: endDateStr,
        status: "approved" // Only approved supplies
      }
      
      const suppliesResponse = await suppliesApi.getSupplies(filters)
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []
      
      // Filter for soybean specifically
      const soybeanSupplies = supplies.filter((supply: any) => 
        supply.product && supply.product.name && (
          supply.product.name.toLowerCase().includes("đậu nành") ||
          supply.product.name.toLowerCase().includes("đậu hạt") ||
          supply.product.name.toLowerCase().includes("soybean")
        )
      )
      console.log("Soybean data loaded:", soybeanSupplies)
      
      setSoybeanData(soybeanSupplies)
      
      // Generate weekly data with real soybean input (will be triggered by useEffect)
      // const weeklyData = generateWeeklyDataWithRealSoybean()
      // setWeeklyTofuData(weeklyData)
      
      console.log("Soybean data loaded:", soybeanSupplies)
      
    } catch (error) {
      console.error("Error fetching soybean data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu đậu nành",
        variant: "destructive",
      })
      setSoybeanData([])
      
      // Fallback to sample data
      const weeklyData = generateSampleWeeklyData()
      setWeeklyTofuData(weeklyData)
    } finally {
      setIsLoadingSoybean(false)
    }
  }

  // Generate weekly data using real soybean input data
  const generateWeeklyDataWithRealSoybean = (): WeeklyTofuData[] => {
    const weekDates = getCurrentWeekDates()
    const startDate = weekDates[0]
    const endDate = weekDates[6]
    
    const dailyData: DailyTofuData[] = weekDates.map((date, index) => {
      // Get real soybean input for this date
      const realSoybeanInput = getSoybeanInputByDate(date)
      
      return {
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        soybeanInput: realSoybeanInput, // Real data from API
        soybeanOutput: realSoybeanInput > 0 ? Math.floor(realSoybeanInput * 0.8) : 0, // 80% processing rate
        soybeanRemaining: 0, // Will be calculated
        tofuOutputToUnits: realSoybeanInput > 0 && index < 5 ? [
          { unitId: "unit1", unitName: "Tiểu đoàn 1", quantity: Math.floor(realSoybeanInput * 0.3) },
          { unitId: "unit2", unitName: "Tiểu đoàn 2", quantity: Math.floor(realSoybeanInput * 0.25) }
        ] : [],
        tofuOutputToOthers: realSoybeanInput > 0 && index < 5 ? `Đơn vị khác: ${Math.floor(realSoybeanInput * 0.1)}kg` : "",
        tofuRemaining: 0, // Will be calculated
        note: realSoybeanInput > 0 ? `Đậu nành nhập: ${realSoybeanInput}kg` : ""
      }
    })

    // Calculate remaining quantities
    dailyData.forEach(day => {
      day.soybeanRemaining = day.soybeanInput - day.soybeanOutput
      const totalTofuToUnits = day.tofuOutputToUnits.reduce((sum, unit) => sum + unit.quantity, 0)
      day.tofuRemaining = day.soybeanOutput - totalTofuToUnits // Assuming 1:1 conversion
    })

    const weeklyTotal: TofuSummary = {
      totalSoybeanInput: dailyData.reduce((sum, day) => sum + day.soybeanInput, 0),
      totalSoybeanOutput: dailyData.reduce((sum, day) => sum + day.soybeanOutput, 0),
      totalSoybeanRemaining: dailyData.reduce((sum, day) => sum + day.soybeanRemaining, 0),
      totalTofuOutputToUnits: dailyData.reduce((sum, day) => 
        sum + day.tofuOutputToUnits.reduce((unitSum, unit) => unitSum + unit.quantity, 0), 0),
      totalTofuOutputToOthers: "Tổng các đơn vị khác trong tuần",
      totalTofuRemaining: dailyData.reduce((sum, day) => sum + day.tofuRemaining, 0)
    }

    return [{
      id: "week-current",
      week: format(startDate, "yyyy-'W'ww"),
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      dailyData,
      weeklyTotal
    }]
  }

  // Fetch data for tofu processing
  const fetchTofuData = async () => {
    try {
      setIsLoading(true)
      
      // Get units data
      try {
        const unitsResponse = await unitsApi.getUnits()
        const unitsData = Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse as any).data || []
        setUnits(unitsData)
      } catch (error) {
        console.log("Could not fetch units, using sample data")
        setUnits([
          { _id: "unit1", name: "Tiểu đoàn 1" },
          { _id: "unit2", name: "Tiểu đoàn 2" },
          { _id: "unit3", name: "Tiểu đoàn 3" },
          { _id: "unit4", name: "Lữ đoàn bộ" }
        ])
      }

      // Get current week dates for soybean data filtering
      const weekDates = getCurrentWeekDates()
      const startDateStr = format(weekDates[0], "yyyy-MM-dd")
      const endDateStr = format(weekDates[6], "yyyy-MM-dd")
      
      // Get soybean input data from supplies with date filter
      const suppliesFilters = {
        stationEntryFromDate: startDateStr,
        stationEntryToDate: endDateStr,
        status: "approved"
      }
      
      const suppliesResponse = await suppliesApi.getSupplies(suppliesFilters)
      const supplies = Array.isArray(suppliesResponse) ? suppliesResponse : (suppliesResponse as any).data || []
      
      // Filter for soybean (đậu nành) supplies that are approved
      const soybeanSupplies = supplies.filter((supply: any) => 
        supply.product && supply.product.name && (
          supply.product.name.toLowerCase().includes("đậu nành") ||
          supply.product.name.toLowerCase().includes("đậu hạt") ||
          supply.product.name.toLowerCase().includes("soybean")
        )
      )
      
      // Don't set soybean data here - it will be handled by fetchSoybeanDataForWeek
      // Only use soybean data for inventory calculation
      console.log("Fetched soybean supplies for inventory calculation:", soybeanSupplies)

      // Get output data
      let tofuOutputs: any[] = []
      try {
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs()
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        // Filter for tofu outputs
        tofuOutputs = outputs.filter((output: any) => 
          output.product?.name?.toLowerCase().includes("đậu phụ")
        )
      } catch (outputError) {
        console.log("No supply outputs found, using empty array")
        tofuOutputs = []
      }

      // Calculate inventory
      const totalInput = soybeanSupplies.reduce((sum: number, supply: any) => sum + (supply.actualQuantity || 0), 0)
      const totalOutput = tofuOutputs.reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
      const remaining = totalInput - totalOutput

      // Weekly data will be generated by useEffect when soybeanData changes
      // Don't generate here to avoid conflicts

      // Set inventory data
      if (soybeanSupplies.length === 0) {
        // Sample data for demonstration
        const sampleInventory = {
          productName: "Đậu nành → Đậu phụ",
          inputQuantity: 150,
          outputQuantity: 80,
          remainingQuantity: 70,
          lastUpdated: new Date().toISOString()
        }
        setInventory([sampleInventory])
      } else {
        setInventory([{
          productName: "Đậu nành → Đậu phụ",
          inputQuantity: totalInput,
          outputQuantity: totalOutput,
          remainingQuantity: remaining,
          lastUpdated: new Date().toISOString()
        }])
      }

    } catch (error) {
      console.error("Error fetching tofu data:", error)
      
      // Fallback to sample data
      const weeklyData = generateSampleWeeklyData()
      setWeeklyTofuData(weeklyData)
      
      const fallbackInventory = {
        productName: "Đậu nành → Đậu phụ",
        inputQuantity: 100,
        outputQuantity: 40,
        remainingQuantity: 60,
        lastUpdated: new Date().toISOString()
      }
      setInventory([fallbackInventory])

      toast({
        title: "Thông báo",
        description: "Đang hiển thị dữ liệu mẫu. Vui lòng đăng nhập để xem dữ liệu thực tế.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTofuData()
  }, [])

  // Initialize soybean data when component mounts or tofu section is active
  useEffect(() => {
    if (activeSection === "tofu") {
      const weekDates = getCurrentWeekDates()
      fetchSoybeanDataForWeek(weekDates[0], weekDates[6])
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection === "livestock") {
      fetchLivestockData(selectedDate)
    }
  }, [selectedDate, activeSection])



  // Generate weekly data when soybeanData changes
  useEffect(() => {
    if (soybeanData.length >= 0 && activeSection === "tofu") {
      const weeklyData = generateWeeklyDataWithRealSoybean()
      setWeeklyTofuData(weeklyData)
      console.log("Generated weekly data with real soybean:", weeklyData)
    }
  }, [soybeanData, activeSection])

  // Calculate input quantities by unit from livestock data
  const getInputQuantityByUnit = (unitName: string, productName: string) => {
    const unitSupplies = livestockData.filter((supply: any) => 
      supply.unitName && supply.unitName.includes(unitName) &&
      supply.product && supply.product.name && supply.product.name.toLowerCase().includes(productName.toLowerCase())
    )
    
    return unitSupplies.reduce((total: number, supply: any) => {
      return total + (supply.actualQuantity || supply.requestedQuantity || 0)
    }, 0)
  }

  // Calculate total input quantity for a product
  const getTotalInputQuantity = (productName: string) => {
    const productSupplies = livestockData.filter((supply: any) =>
      supply.product && supply.product.name && supply.product.name.toLowerCase().includes(productName.toLowerCase())
    )
    
    return productSupplies.reduce((total: number, supply: any) => {
      return total + (supply.actualQuantity || supply.requestedQuantity || 0)
    }, 0)
  }

  // Calculate soybean input quantity for specific date
  const getSoybeanInputByDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    
    console.log(`Checking soybean input for ${dateStr}, total soybeanData:`, soybeanData.length)
    
    const daySupplies = soybeanData.filter((supply: any) => {
      const supplyDate = supply.stationEntryDate || supply.createdAt
      const supplyDateStr = supplyDate ? format(new Date(supplyDate), "yyyy-MM-dd") : null
      
      console.log(`Supply ${supply.id}: date=${supplyDateStr}, matching=${supplyDateStr === dateStr}`)
      
      return supplyDate && supplyDateStr === dateStr
    })
    
    const totalQuantity = daySupplies.reduce((total: number, supply: any) => {
      return total + (supply.actualQuantity || supply.requestedQuantity || 0)
    }, 0)
    
    // Debug log for specific date
    console.log(`Soybean input for ${dateStr}:`, totalQuantity, "from", daySupplies.length, "supplies:", daySupplies)
    
    return totalQuantity
  }

  const sections = [
    { id: "tofu", name: "Chế biến đậu phụ", icon: Package, color: "bg-green-100 text-green-800" },
    { id: "sausage", name: "Làm giò chả", icon: Utensils, color: "bg-orange-100 text-orange-800" },
    { id: "sprouts", name: "Giá đỗ", icon: Wheat, color: "bg-yellow-100 text-yellow-800" },
    { id: "salt", name: "Muối nén", icon: Droplets, color: "bg-blue-100 text-blue-800" },
    { id: "livestock", name: "Giết mổ lợn", icon: Beef, color: "bg-red-100 text-red-800" },
    { id: "seafood", name: "Gia cầm, hải sản", icon: Fish, color: "bg-purple-100 text-purple-800" },
    { id: "lttp", name: "Quản lý LTTP", icon: Package, color: "bg-indigo-100 text-indigo-800" },
  ]

  const handleUpdateDay = (day: DailyTofuData) => {
    setDayToUpdate(day)
    setUpdateData({
      soybeanInput: day.soybeanInput,
      soybeanOutput: day.soybeanOutput,
      tofuOutputToUnits: [...day.tofuOutputToUnits],
      tofuOutputToOthers: day.tofuOutputToOthers,
      note: day.note,
    })
    setUpdateDialogOpen(true)
  }

  const addUnitOutput = () => {
    setUpdateData(prev => ({
      ...prev,
      tofuOutputToUnits: [...prev.tofuOutputToUnits, { unitId: "", unitName: "", quantity: 0 }]
    }))
  }

  const removeUnitOutput = (index: number) => {
    setUpdateData(prev => ({
      ...prev,
      tofuOutputToUnits: prev.tofuOutputToUnits.filter((_, i) => i !== index)
    }))
  }

  const updateUnitOutput = (index: number, field: keyof TofuOutputToUnit, value: any) => {
    setUpdateData(prev => ({
      ...prev,
      tofuOutputToUnits: prev.tofuOutputToUnits.map((unit, i) => {
        if (i === index) {
          if (field === "unitId") {
            const selectedUnit = units.find(u => u._id === value)
            return { ...unit, unitId: value, unitName: selectedUnit?.name || "" }
          }
          return { ...unit, [field]: value }
        }
        return unit
      })
    }))
  }

  const confirmUpdate = async () => {
    if (!dayToUpdate) return

    setIsUpdating(true)
    try {
      // Calculate remaining quantities
      const soybeanRemaining = updateData.soybeanInput - updateData.soybeanOutput
      const totalTofuToUnits = updateData.tofuOutputToUnits.reduce((sum, unit) => sum + unit.quantity, 0)
      const tofuRemaining = updateData.soybeanOutput - totalTofuToUnits

      // Update the weekly data
      const updatedWeeklyData = weeklyTofuData.map(week => ({
        ...week,
        dailyData: week.dailyData.map(day => {
          if (day.date === dayToUpdate.date) {
            return {
              ...day,
              soybeanInput: updateData.soybeanInput,
              soybeanOutput: updateData.soybeanOutput,
              soybeanRemaining,
              tofuOutputToUnits: updateData.tofuOutputToUnits,
              tofuOutputToOthers: updateData.tofuOutputToOthers,
              tofuRemaining,
              note: updateData.note,
            }
          }
          return day
        })
      }))

      // Recalculate weekly totals
      updatedWeeklyData.forEach(week => {
        week.weeklyTotal = {
          totalSoybeanInput: week.dailyData.reduce((sum, day) => sum + day.soybeanInput, 0),
          totalSoybeanOutput: week.dailyData.reduce((sum, day) => sum + day.soybeanOutput, 0),
          totalSoybeanRemaining: week.dailyData.reduce((sum, day) => sum + day.soybeanRemaining, 0),
          totalTofuOutputToUnits: week.dailyData.reduce((sum, day) => 
            sum + day.tofuOutputToUnits.reduce((unitSum, unit) => unitSum + unit.quantity, 0), 0),
          totalTofuOutputToOthers: "Tổng các đơn vị khác trong tuần",
          totalTofuRemaining: week.dailyData.reduce((sum, day) => sum + day.tofuRemaining, 0)
        }
      })

      setWeeklyTofuData(updatedWeeklyData)

      toast({
        title: "Thành công",
        description: `Đã cập nhật dữ liệu ${dayToUpdate.dayOfWeek}!`,
      })

      setUpdateDialogOpen(false)
      setDayToUpdate(null)
    } catch (error) {
      console.error("Error updating day data:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

    return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-center text-[#b45f06] mb-2">
            TRẠM CHẾ BIẾN
          </h1>
          <p className="text-center text-gray-600">
            Quản lý chế biến và sản xuất thực phẩm
          </p>
            </div>

        {/* Section Navigation */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              const isImplemented = ["tofu", "livestock", "lttp"].includes(section.id)
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center gap-2 ${
                    !isImplemented ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => isImplemented && setActiveSection(section.id)}
                  disabled={!isImplemented}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{section.name}</span>
                  {!isImplemented && (
                    <Badge variant="secondary" className="text-xs">
                      Sắp có
                    </Badge>
                  )}
                </Button>
              )
            })}
            </div>
            </div>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === "tofu" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-green-800">Chế biến đậu phụ</h2>
                <Badge className="bg-green-100 text-green-800">
                  Tỷ lệ: 1kg đậu nành = 1kg đậu phụ
                </Badge>
          </div>

              {/* Inventory Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {inventory.map((item, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {item.productName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Đậu hạt nhập:</span>
                        <span className="font-semibold text-blue-600">
                          {item.inputQuantity.toLocaleString()} kg
                        </span>
              </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Đậu phụ xuất:</span>
                        <span className="font-semibold text-green-600">
                          {item.outputQuantity.toLocaleString()} kg
                        </span>
            </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Tồn kho:</span>
                        <span className="font-bold text-orange-600">
                          {item.remainingQuantity.toLocaleString()} kg
                        </span>
              </div>
                      <div className="text-xs text-gray-500">
                        Cập nhật: {format(new Date(item.lastUpdated), "dd/MM/yyyy HH:mm", { locale: vi })}
          </div>
        </CardContent>
      </Card>
                ))}
              </div>

              {/* Processing Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Bảng theo dõi chế biến đậu phụ theo tuần</CardTitle>
                  <p className="text-sm text-gray-600">
                    Theo dõi chi tiết từng ngày trong tuần (Thứ 2 - Chủ nhật)
                  </p>
        </CardHeader>
        <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Đang tải dữ liệu...</div>
                  ) : (
                    <div className="space-y-6">
                      {weeklyTofuData.map((week) => (
                        <div key={week.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              Tuần {week.week} ({format(new Date(week.startDate), "dd/MM", { locale: vi })} - {format(new Date(week.endDate), "dd/MM/yyyy", { locale: vi })})
                            </h3>
                          </div>
                          
                          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                                  <TableHead className="min-w-[100px]">Ngày</TableHead>
                                  <TableHead className="text-center">Đậu hạt nhập (kg)</TableHead>
                                  <TableHead className="text-center">Đậu hạt xuất (kg)</TableHead>
                                  <TableHead className="text-center">Đậu hạt tồn (kg)</TableHead>
                                  <TableHead className="text-center">Đậu phụ xuất đơn vị (kg)</TableHead>
                                  <TableHead className="text-center">Đậu phụ xuất khác</TableHead>
                                  <TableHead className="text-center">Đậu phụ tồn (kg)</TableHead>
                                  <TableHead className="min-w-[150px]">Ghi chú</TableHead>
                                  <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                                {week.dailyData.map((day) => (
                                  <TableRow key={day.date} className={day.dayOfWeek.includes("Chủ nhật") ? "bg-gray-50" : ""}>
                                    <TableCell className="font-medium">
                                      <div>
                                        <div className="font-semibold">{day.dayOfWeek}</div>
                                        <div className="text-sm text-gray-500">
                                          {format(new Date(day.date), "dd/MM", { locale: vi })}
                                        </div>
                    </div>
                  </TableCell>
                                    <TableCell className="text-center font-semibold text-blue-600">
                                      {day.soybeanInput.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-orange-600">
                                      {day.soybeanOutput.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-purple-600">
                                      {day.soybeanRemaining.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="space-y-1">
                                        {day.tofuOutputToUnits.map((unit, index) => (
                                          <div key={index} className="text-sm">
                                            <span className="font-medium text-green-600">{unit.quantity}kg</span>
                                            <span className="text-gray-500 ml-1">({unit.unitName})</span>
                                          </div>
                                        ))}
                                        {day.tofuOutputToUnits.length === 0 && (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      {day.tofuOutputToOthers || "—"}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-indigo-600">
                                      {day.tofuRemaining.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {day.note || "—"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs"
                                        onClick={() => handleUpdateDay(day)}
                                      >
                                        Cập nhật
                                      </Button>
                  </TableCell>
                </TableRow>
              ))}
                                
                                {/* Weekly Total Row */}
                                <TableRow className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                                  <TableCell className="font-bold text-blue-800">
                                    TỔNG TUẦN
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-blue-600">
                                    {week.weeklyTotal.totalSoybeanInput.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-orange-600">
                                    {week.weeklyTotal.totalSoybeanOutput.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-purple-600">
                                    {week.weeklyTotal.totalSoybeanRemaining.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-green-600">
                                    {week.weeklyTotal.totalTofuOutputToUnits.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-center text-sm font-medium">
                                    {week.weeklyTotal.totalTofuOutputToOthers}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-indigo-600">
                                    {week.weeklyTotal.totalTofuRemaining.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    Tổng cả tuần
                                  </TableCell>
                                  <TableCell className="text-center">
                                    —
                                  </TableCell>
                                </TableRow>
            </TableBody>
          </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
        </CardContent>
      </Card>
            </div>
          )}

          {activeSection === "livestock" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Beef className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-bold text-red-800">Giết mổ lợn</h2>
                <Badge className="bg-red-100 text-red-800">
                  Quản lý phân phối thịt lợn
                </Badge>
              </div>

              {/* Date Filter */}
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <label htmlFor="livestock-date" className="font-medium text-sm">
                          Chọn ngày:
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(selectedDate)
                            newDate.setDate(newDate.getDate() - 1)
                            setSelectedDate(newDate)
                            toast({
                              title: "Đã chuyển sang hôm qua",
                              description: `Xem dữ liệu ngày ${format(newDate, "dd/MM/yyyy", { locale: vi })}`,
                            })
                          }}
                        >
                          ← Hôm qua
                        </Button>
                        <Input
                          id="livestock-date"
                          type="date"
                          value={format(selectedDate, "yyyy-MM-dd")}
                          className="w-40"
                          onChange={(e) => {
                            const newDate = new Date(e.target.value)
                            setSelectedDate(newDate)
                            toast({
                              title: "Đã thay đổi ngày",
                              description: `Xem dữ liệu ngày ${format(newDate, "dd/MM/yyyy", { locale: vi })}`,
                            })
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(selectedDate)
                            newDate.setDate(newDate.getDate() + 1)
                            setSelectedDate(newDate)
                            toast({
                              title: "Đã chuyển sang ngày mai",
                              description: `Xem dữ liệu ngày ${format(newDate, "dd/MM/yyyy", { locale: vi })}`,
                            })
                          }}
                        >
                          Ngày mai →
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDate(new Date())
                          toast({
                            title: "Đã chuyển về hôm nay",
                            description: `Xem dữ liệu ngày ${format(new Date(), "dd/MM/yyyy", { locale: vi })}`,
                          })
                        }}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Hôm nay
                      </Button>
                      <Badge variant="outline" className="text-sm">
                        {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bảng tổng hợp ngày trước chuyển qua và nhập trong ngày</span>
                    <Badge variant="secondary" className="text-sm">
                      {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Theo dõi nhập - xuất - tồn thịt và sản phẩm gia súc cho các đơn vị • Ngày được chọn: {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2} className="text-center border-r w-8">TT</TableHead>
                          <TableHead rowSpan={2} className="text-center border-r w-24">Tên LTP</TableHead>
                          <TableHead rowSpan={2} className="text-center border-r w-12">Đvt</TableHead>
                          <TableHead rowSpan={2} className="text-center border-r w-20">Đơn giá</TableHead>
                          <TableHead colSpan={2} className="text-center border-r bg-gray-50">Ngày trước chuyển qua</TableHead>
                          <TableHead colSpan={8} className="text-center border-r bg-blue-50">Nhập trong ngày</TableHead>
                          <TableHead colSpan={8} className="text-center border-r bg-yellow-50">Xuất trong ngày</TableHead>
                          <TableHead colSpan={2} className="text-center bg-purple-50">Tồn cuối ngày</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-center w-16 border-r">Số lượng</TableHead>
                          <TableHead className="text-center w-20 border-r">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 1<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 2<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 3<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16 border-r">Lữ đoàn bộ<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20 border-r">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 1<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 2<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Tiểu đoàn 3<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                          <TableHead className="text-center w-16 border-r">Lữ đoàn bộ<br/>Số lượng</TableHead>
                          <TableHead className="text-center w-20 border-r">Thành tiền</TableHead>
                          <TableHead className="text-center w-16">Số lượng</TableHead>
                          <TableHead className="text-center w-20">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 1, name: "Thịt xá", price: "65,000" },
                          { id: 2, name: "Thịt nạc", price: "80,000" },
                          { id: 3, name: "Xương", price: "15,000" },
                          { id: 4, name: "Sườn", price: "70,000" },
                          { id: 5, name: "Lòng", price: "45,000" },
                          { id: 6, name: "Sụn", price: "35,000" },
                          { id: 7, name: "Da con", price: "25,000" },
                          { id: 8, name: "Mỡ", price: "30,000" }
                        ].map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-medium border-r">{item.id}</TableCell>
                            <TableCell className="font-medium border-r">{item.name}</TableCell>
                            <TableCell className="text-center border-r">kg</TableCell>
                            <TableCell className="text-center border-r">{item.price}</TableCell>
                            {/* Ngày trước chuyển qua */}
                            <TableCell className="text-center bg-gray-50">
                              <span className="text-xs font-semibold">
                                {isLoadingLivestock ? "..." : getTotalInputQuantity(item.name)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-gray-50 border-r">
                              <span className="text-xs">
                                {((getTotalInputQuantity(item.name) * parseFloat(item.price.replace(",", ""))) || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            {/* Nhập trong ngày - 4 đơn vị */}
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs font-semibold text-blue-800">
                                {isLoadingLivestock ? "..." : getInputQuantityByUnit("Tiểu đoàn 1", item.name)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs">
                                {((getInputQuantityByUnit("Tiểu đoàn 1", item.name) * parseFloat(item.price.replace(",", ""))) || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs font-semibold text-blue-800">
                                {isLoadingLivestock ? "..." : getInputQuantityByUnit("Tiểu đoàn 2", item.name)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs">
                                {((getInputQuantityByUnit("Tiểu đoàn 2", item.name) * parseFloat(item.price.replace(",", ""))) || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs font-semibold text-blue-800">
                                {isLoadingLivestock ? "..." : getInputQuantityByUnit("Tiểu đoàn 3", item.name)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs">
                                {((getInputQuantityByUnit("Tiểu đoàn 3", item.name) * parseFloat(item.price.replace(",", ""))) || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50">
                              <span className="text-xs font-semibold text-blue-800">
                                {isLoadingLivestock ? "..." : getInputQuantityByUnit("Lữ đoàn", item.name)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center bg-blue-50 border-r">
                              <span className="text-xs">
                                {((getInputQuantityByUnit("Lữ đoàn", item.name) * parseFloat(item.price.replace(",", ""))) || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            {/* Xuất trong ngày - 4 đơn vị */}
                            <TableCell className="text-center bg-yellow-50">
                              <Input type="number" placeholder="0" className="w-12 h-6 text-center text-xs border-yellow-200" />
                            </TableCell>
                            <TableCell className="text-center bg-yellow-50"><span className="text-xs">0</span></TableCell>
                            <TableCell className="text-center bg-yellow-50">
                              <Input type="number" placeholder="0" className="w-12 h-6 text-center text-xs border-yellow-200" />
                            </TableCell>
                            <TableCell className="text-center bg-yellow-50"><span className="text-xs">0</span></TableCell>
                            <TableCell className="text-center bg-yellow-50">
                              <Input type="number" placeholder="0" className="w-12 h-6 text-center text-xs border-yellow-200" />
                            </TableCell>
                            <TableCell className="text-center bg-yellow-50"><span className="text-xs">0</span></TableCell>
                            <TableCell className="text-center bg-yellow-50">
                              <Input type="number" placeholder="0" className="w-12 h-6 text-center text-xs border-yellow-200" />
                            </TableCell>
                            <TableCell className="text-center bg-yellow-50 border-r"><span className="text-xs">0</span></TableCell>
                            {/* Tồn cuối ngày */}
                            <TableCell className="text-center bg-purple-50"><span className="text-xs">0</span></TableCell>
                            <TableCell className="text-center bg-purple-50"><span className="text-xs">0</span></TableCell>
                          </TableRow>
                        ))}


                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p><span className="inline-block w-4 h-4 bg-green-50 border border-green-200 mr-2"></span>Phân phối cho đơn vị</p>
                      <p><span className="inline-block w-4 h-4 bg-blue-50 border border-blue-200 mr-2"></span>Nhập trong ngày</p>
                      <p><span className="inline-block w-4 h-4 bg-yellow-50 border border-yellow-200 mr-2"></span>Xuất trong ngày</p>
                      <p><span className="inline-block w-4 h-4 bg-purple-50 border border-purple-200 mr-2"></span>Tồn kho cuối ngày</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline">
                        Nhập từ Excel
                      </Button>
                      <Button variant="outline">
                        Xuất báo cáo
                      </Button>
                      <Button>
                        Lưu dữ liệu
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "lttp" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-indigo-800">Quản lý LTTP</h2>
                <Badge className="bg-indigo-100 text-indigo-800">
                  Lương thực thực phẩm
                </Badge>
              </div>

              {/* LTTP Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tổng nhập mới
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventory.reduce((sum, item) => sum + item.inputQuantity, 0).toLocaleString()} kg
                    </div>
                    <p className="text-xs text-gray-500">Từ nguồn nhập</p>
                  </CardContent>
            </Card>

            <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tồn trạm hiện tại
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {inventory.reduce((sum, item) => sum + item.remainingQuantity, 0).toLocaleString()} kg
                    </div>
                    <p className="text-xs text-gray-500">Có thể sử dụng</p>
                  </CardContent>
            </Card>

            <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Đã xuất
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {inventory.reduce((sum, item) => sum + item.outputQuantity, 0).toLocaleString()} kg
                    </div>
                    <p className="text-xs text-gray-500">Đã chế biến/phân phối</p>
                  </CardContent>
            </Card>

            <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tỷ lệ sử dụng
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {inventory.length > 0 ? 
                        Math.round((inventory.reduce((sum, item) => sum + item.outputQuantity, 0) / 
                        inventory.reduce((sum, item) => sum + item.inputQuantity, 0)) * 100) : 0}%
                    </div>
                    <p className="text-xs text-gray-500">Hiệu quả sử dụng</p>
                  </CardContent>
            </Card>
              </div>

              {/* LTTP Management Table */}
            <Card>
              <CardHeader>
                  <CardTitle>Bảng quản lý lương thực thực phẩm</CardTitle>
                  <p className="text-sm text-gray-600">
                    Theo dõi nhập - xuất - tồn của tất cả loại thực phẩm trong trạm chế biến
                  </p>
              </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Đang tải dữ liệu...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>STT</TableHead>
                          <TableHead>Phân loại</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>
                            <div className="text-center">Nhập mới</div>
                            <div className="grid grid-cols-3 text-xs mt-1 gap-1">
                              <div>Số lượng (kg)</div>
                              <div>Ngày nhập</div>
                              <div>Trạng thái</div>
              </div>
                          </TableHead>
                          <TableHead>
                            <div className="text-center">Tồn trạm</div>
                            <div className="grid grid-cols-3 text-xs mt-1 gap-1">
                              <div>Số lượng (kg)</div>
                              <div>Cập nhật</div>
                              <div>Trạng thái</div>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="text-center">Tổng</div>
                            <div className="grid grid-cols-2 text-xs mt-1 gap-1">
                              <div>Chưa hết hạn</div>
                              <div>Đã xuất</div>
                            </div>
                          </TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              Chưa có dữ liệu LTTP
                            </TableCell>
                          </TableRow>
                        ) : (
                          inventory.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Badge variant="outline">Chế biến</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell>
                                <div className="grid grid-cols-3 gap-1 text-sm">
                                  <div className="font-semibold text-blue-600">
                                    {item.inputQuantity.toLocaleString()}
                                  </div>
                                  <div className="text-gray-600">
                                    {format(new Date(item.lastUpdated), "dd/MM", { locale: vi })}
                                  </div>
                                  <div>
                                    <Badge variant="default" className="text-xs">
                                      Mới nhập
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="grid grid-cols-3 gap-1 text-sm">
                                  <div className="font-semibold text-orange-600">
                                    {item.remainingQuantity.toLocaleString()}
                                  </div>
                                  <div className="text-gray-600">
                                    {format(new Date(item.lastUpdated), "dd/MM", { locale: vi })}
                                  </div>
                                  <div>
                                    <Badge 
                                      variant={item.remainingQuantity > 0 ? "default" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {item.remainingQuantity > 0 ? "Còn hàng" : "Hết hàng"}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                  <div className="font-semibold text-green-600">
                                    {item.remainingQuantity.toLocaleString()}
                                  </div>
                                  <div className="font-semibold text-red-600">
                                    {item.outputQuantity.toLocaleString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                Chế biến đậu phụ
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm" className="text-xs">
                                    Cập nhật
              </Button>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    Chi tiết
              </Button>
            </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
            </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                    <CardTitle className="text-base">Báo cáo tồn kho</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cảnh báo hết hạn</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      Kiểm tra hạn sử dụng
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nhập thêm LTTP</CardTitle>
              </CardHeader>
              <CardContent>
                    <Button className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      Thêm mới
                </Button>
              </CardContent>
            </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật dữ liệu chế biến - {dayToUpdate?.dayOfWeek}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chế biến đậu phụ cho ngày {dayToUpdate?.date && format(new Date(dayToUpdate.date), "dd/MM/yyyy", { locale: vi })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="update-soybean-input" className="font-medium">
                  Đậu hạt nhập (kg) *
                </label>
                <Input
                  id="update-soybean-input"
                  type="number"
                  value={updateData.soybeanInput || ""}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, soybeanInput: Number(e.target.value) || 0 }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="update-soybean-output" className="font-medium">
                  Đậu hạt xuất (kg) *
                </label>
                <Input
                  id="update-soybean-output"
                  type="number"
                  value={updateData.soybeanOutput || ""}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, soybeanOutput: Number(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium">Đậu phụ xuất đơn vị (kg)</label>
                <Button type="button" variant="outline" size="sm" onClick={addUnitOutput}>
                  + Thêm đơn vị
                </Button>
          </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {updateData.tofuOutputToUnits.map((unit, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 border rounded">
                    <Select
                      value={unit.unitId}
                      onValueChange={(value) => updateUnitOutput(index, "unitId", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unitOption) => (
                          <SelectItem key={unitOption._id} value={unitOption._id}>
                            {unitOption.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Số lượng (kg)"
                      value={unit.quantity || ""}
                      onChange={(e) => updateUnitOutput(index, "quantity", Number(e.target.value) || 0)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeUnitOutput(index)}
                      className="text-red-600"
                    >
                      Xóa
                    </Button>
        </div>
                ))}
                {updateData.tofuOutputToUnits.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có đơn vị nào. Nhấn "Thêm đơn vị" để thêm.
                  </p>
                )}
      </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="update-tofu-output-to-others" className="font-medium">
                Đậu phụ xuất khác (nhập tay)
              </label>
              <Input
                id="update-tofu-output-to-others"
                placeholder="VD: Đơn vị ABC: 5kg, Đơn vị XYZ: 3kg"
                value={updateData.tofuOutputToOthers}
                onChange={(e) => setUpdateData(prev => ({ ...prev, tofuOutputToOthers: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Nhập thông tin các đơn vị khác không có trong danh sách
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="update-note" className="font-medium">
                Ghi chú
              </label>
              <textarea
                id="update-note"
                className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md"
                placeholder="Ghi chú về quá trình chế biến trong ngày"
                value={updateData.note}
                onChange={(e) => setUpdateData(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-800">Tóm tắt tính toán:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Đậu hạt tồn:</span>
                  <span className="ml-2 font-semibold text-purple-600">
                    {Math.max(0, updateData.soybeanInput - updateData.soybeanOutput).toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Đậu phụ tồn:</span>
                  <span className="ml-2 font-semibold text-indigo-600">
                    {Math.max(0, updateData.soybeanOutput - updateData.tofuOutputToUnits.reduce((sum, unit) => sum + unit.quantity, 0)).toLocaleString()} kg
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
