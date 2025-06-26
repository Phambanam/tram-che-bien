"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Utensils, Fish, Beef, Wheat, Droplets } from "lucide-react"
import { TofuProcessing, SausageProcessing, LivestockProcessing, LttpManagement } from "@/components/processing-station"

// Simple processing station content with navigation only

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

  // New state for daily tofu processing table
  const [dailyTofuProcessing, setDailyTofuProcessing] = useState<DailyTofuProcessing | null>(null)
  const [monthlyTofuSummary, setMonthlyTofuSummary] = useState<MonthlyTofuSummary[]>([])
  const [editingDailyData, setEditingDailyData] = useState(false)
  const [dailyUpdateData, setDailyUpdateData] = useState({
    soybeanInput: 0,
    tofuInput: 0,
    note: ""
  })

  // Approval state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [supplyToApprove, setSupplyToApprove] = useState<SupplySource | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
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
  const [updateData, setUpdateData] = useState({
    soybeanInput: 0,
    soybeanOutput: 0,
    tofuOutputToUnits: [] as TofuOutputToUnit[],
    tofuOutputToOthers: "",
        note: "",
  })

  // Add weekly tracking state
  const [weeklyTracking, setWeeklyTracking] = useState<WeeklyTofuTracking[]>([])

  // Add sausage processing state
  const [dailySausageProcessing, setDailySausageProcessing] = useState<DailySausageProcessing | null>(null)
  const [editingSausageData, setEditingSausageData] = useState(false)
  const [sausageUpdateData, setSausageUpdateData] = useState({
    porkLeanInput: 0,
    porkFatInput: 0,
    sausageInput: 0,
    fishCakeInput: 0,
    note: ""
  })
  const [weeklySausageTracking, setWeeklySausageTracking] = useState<WeeklySausageTracking[]>([])

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
      // Don't reset soybeanData to empty array - keep existing data
      // setSoybeanData([])
      
      // Fallback to sample data only if no existing weekly data
      if (weeklyTofuData.length === 0) {
        const weeklyData = generateSampleWeeklyData()
        setWeeklyTofuData(weeklyData)
      }
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
    if (soybeanData.length > 0 && activeSection === "tofu") {
      console.log("Regenerating weekly data with soybeanData:", soybeanData.length, "items")
      const weeklyData = generateWeeklyDataWithRealSoybean()
      setWeeklyTofuData(weeklyData)
      console.log("Generated weekly data with real soybean:", weeklyData)
    }
  }, [soybeanData, activeSection])

  // Calculate tofu output needed from menu planning (expected requirement)
  const calculateTofuOutputNeeded = async (date: Date): Promise<number> => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get ingredient summaries from menu planning for this specific date
      const params = {
        date: dateStr,
        showAllDays: false // Only for specific date
      }
      
      const response = await menuPlanningApi.getDailyIngredientSummaries(params)
      
      if (!response.success || !response.data || response.data.length === 0) {
        console.log(`No menu data found for ${dateStr}, using fallback calculation`)
        return calculateFallbackTofuNeed(date)
      }
      
      // Get units and their personnel for this date (only once)
      let totalPersonnel = 0
      try {
        const unitsResponse = await unitsApi.getUnits()
        const unitsData = Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse as any).data || []
        
        // Get personnel count for this specific date
        const startDate = format(date, "yyyy-MM-dd")
        const endDate = format(date, "yyyy-MM-dd")
        const personnelResponse = await unitPersonnelDailyApi.getPersonnelByWeek(startDate, endDate)
        
        if (personnelResponse.success && personnelResponse.data && personnelResponse.data[dateStr]) {
          totalPersonnel = Object.values(personnelResponse.data[dateStr]).reduce((sum: number, p: any) => sum + p, 0)
        } else {
          // Fallback to default personnel from units
          totalPersonnel = unitsData.reduce((sum: number, unit: any) => sum + (unit.personnel || 100), 0)
        }
      } catch (unitError) {
        console.log("Error getting units/personnel data:", unitError)
        totalPersonnel = 400 // Default fallback
      }
      
      // Collect all unique tofu ingredients across all meals for the day
      const tofuIngredients = new Map<string, number>() // lttpName -> max quantity needed
      
      for (const dailySummary of response.data) {
        for (const ingredient of dailySummary.ingredients) {
          // Check if this ingredient is tofu-related
          if (
              ingredient.lttpName.toLowerCase().includes("đậu phụ") ||
              ingredient.lttpName.toLowerCase().includes("tofu")) {
            
            const currentQuantity = tofuIngredients.get(ingredient.lttpName) || 0
            // Take the maximum quantity needed for this ingredient across all meals
            tofuIngredients.set(ingredient.lttpName, Math.max(currentQuantity, ingredient.totalQuantity))
            
            console.log(`Date ${dateStr}: Found tofu ingredient "${ingredient.lttpName}", quantity per 100 people: ${ingredient.totalQuantity}kg`)
          }
        }
      }
      
      // Calculate total tofu needed for the day
      let totalTofuNeeded = 0
      for (const [ingredientName, quantityPer100] of tofuIngredients) {
        const tofuNeeded = (totalPersonnel * quantityPer100) / 100
        totalTofuNeeded += tofuNeeded
        
        console.log(`Date ${dateStr}: Ingredient "${ingredientName}" for ${totalPersonnel} people, need ${tofuNeeded}kg`)
      }
      
      // If no tofu found in menu, use fallback calculation
      if (totalTofuNeeded === 0) {
        console.log(`No tofu ingredients found in menu for ${dateStr}, using fallback calculation`)
        return calculateFallbackTofuNeed(date)
      }
      
      console.log(`Total tofu needed for ${dateStr}: ${totalTofuNeeded}kg (from ${tofuIngredients.size} unique ingredients)`)
      return totalTofuNeeded
      
    } catch (error) {
      console.error("Error calculating tofu output needed:", error)
      return calculateFallbackTofuNeed(date)
    }
  }

  // Fallback calculation when no tofu in menu or no menu data
  const calculateFallbackTofuNeed = async (date: Date): Promise<number> => {
    try {
      // Get total personnel from units
      const unitsResponse = await unitsApi.getUnits()
      const unitsData = Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse as any).data || []
      
      const totalPersonnel = unitsData.reduce((sum: number, unit: any) => sum + (unit.personnel || 100), 0)
      
      // Standard tofu requirement: 0.15kg per person per day (150g)
      const standardTofuPerPerson = 0.15
      const fallbackTofuNeed = totalPersonnel * standardTofuPerPerson
      
      console.log(`Fallback calculation: ${totalPersonnel} people × ${standardTofuPerPerson}kg = ${fallbackTofuNeed}kg tofu needed`)
      
      return fallbackTofuNeed
      
    } catch (error) {
      console.error("Error in fallback calculation:", error)
      // Last resort: assume 400 people × 0.15kg = 60kg
      return 60
    }
  }

  // Fetch daily tofu processing data
  const fetchDailyTofuProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get station manager input data from processing station API
      let stationData = {
        soybeanInput: 0,
        tofuInput: 0,
        note: ""
      }
      
      try {
        const stationResponse = await processingStationApi.getDailyData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            soybeanInput: stationResponse.data.soybeanInput || 0,
            tofuInput: stationResponse.data.tofuInput || 0,
            note: stationResponse.data.note || ""
          }
          console.log("Station data:", stationData)
        }
      } catch (error) {
        console.log("No station data found for date, using defaults:", error)
      }

      // Get actual tofu output from supply outputs (thực tế đã xuất)
      let actualTofuOutput = 0
      try {
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
          date: dateStr
        })
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        // Calculate actual tofu outputs for this date
        actualTofuOutput = outputs
          .filter((output: any) => {
            const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
            return outputDate === dateStr && 
                   output.product?.name?.toLowerCase().includes("đậu phụ")
          })
          .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          
        console.log(`Actual tofu output for ${dateStr}:`, actualTofuOutput)
      } catch (error) {
        console.log("No tofu output data found, using 0:", error)
      }

      // Calculate remaining tofu
      const tofuRemaining = stationData.tofuInput - actualTofuOutput

      const processingData: DailyTofuProcessing = {
        date: dateStr,
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        tofuOutput: actualTofuOutput, // Thực tế đã xuất (từ quản lý nguồn xuất)
        tofuRemaining: Math.max(0, tofuRemaining),
        note: stationData.note
      }

      setDailyTofuProcessing(processingData)
      
      // Update dailyUpdateData for editing
      setDailyUpdateData({
        soybeanInput: stationData.soybeanInput,
        tofuInput: stationData.tofuInput,
        note: stationData.note
      })

    } catch (error) {
      console.error("Error fetching daily tofu processing data:", error)
      
      // Set default data
      const defaultData: DailyTofuProcessing = {
        date: format(date, "yyyy-MM-dd"),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0,
        note: ""
      }
      setDailyTofuProcessing(defaultData)
      setDailyUpdateData({
        soybeanInput: 0,
        tofuInput: 0,
        note: ""
      })
    }
  }

  // Add function to fetch weekly tracking data
  const fetchWeeklyTracking = async () => {
    try {
      const weekDates = getCurrentWeekDates()
      const weeklyData: WeeklyTofuTracking[] = []

      for (const date of weekDates) {
        const dateStr = format(date, "yyyy-MM-dd")
        
        // Get station data
        let stationData = { soybeanInput: 0, tofuInput: 0 }
        try {
          const stationResponse = await processingStationApi.getDailyData(dateStr)
          if (stationResponse && stationResponse.data) {
            stationData = {
              soybeanInput: stationResponse.data.soybeanInput || 0,
              tofuInput: stationResponse.data.tofuInput || 0
            }
          }
        } catch (error) {
          // Use default values
        }

        // Get actual tofu output from supply outputs (thực tế đã xuất)
        let actualTofuOutput = 0
        try {
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            date: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          
          actualTofuOutput = outputs
            .filter((output: any) => {
              const outputDate = output.outputDate ? format(new Date(output.outputDate), "yyyy-MM-dd") : null
              return outputDate === dateStr && 
                     output.product?.name?.toLowerCase().includes("đậu phụ")
            })
            .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
        } catch (error) {
          // Use default 0
        }

        weeklyData.push({
          date: dateStr,
          dayOfWeek: getDayName(date.getDay()),
          soybeanInput: stationData.soybeanInput,
          tofuInput: stationData.tofuInput,
          tofuOutput: actualTofuOutput, // Thực tế đã xuất (từ quản lý nguồn xuất)
          tofuRemaining: Math.max(0, stationData.tofuInput - actualTofuOutput)
        })
      }

      setWeeklyTracking(weeklyData)
    } catch (error) {
      console.error("Error fetching weekly tracking data:", error)
      
      // Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklyTofuTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        soybeanInput: 0,
        tofuInput: 0,
        tofuOutput: 0,
        tofuRemaining: 0
      }))
      setWeeklyTracking(sampleWeeklyData)
    }
  }

  // Fetch monthly tofu summary
  const fetchMonthlyTofuSummary = async () => {
    try {
      // Get current month and previous months data
      const currentDate = new Date()
      const months = []
      
      // Get last 6 months including current month
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        months.push(date)
      }
      
      const monthlySummaries: MonthlyTofuSummary[] = []
      
      for (const month of months) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        // Get processing station data for the month
        const processingResponse = await processingStationApi.getItems()
        const processingItems = Array.isArray(processingResponse) ? processingResponse : (processingResponse as any).data || []
        
        // Filter for tofu processing in this month
        const monthProcessing = processingItems.filter((item: any) => {
          const itemDate = new Date(item.processingDate)
          return item.type === 'tofu' && 
                 itemDate >= startOfMonth && 
                 itemDate <= endOfMonth
        })
        
        // Get tofu outputs for the month
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs()
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        const monthOutputs = outputs.filter((output: any) => {
          const outputDate = new Date(output.outputDate)
          return outputDate >= startOfMonth && 
                 outputDate <= endOfMonth &&
                 output.product?.name?.toLowerCase().includes('đậu phụ')
        })
        
        const totalSoybeanInput = monthProcessing.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        const totalTofuCollected = monthProcessing.reduce((sum: number, item: any) => sum + (item.nonExpiredQuantity || 0), 0)
        const totalTofuOutput = monthOutputs.reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
        const totalTofuRemaining = totalTofuCollected - totalTofuOutput
        const processingEfficiency = totalSoybeanInput > 0 ? Math.round((totalTofuCollected / totalSoybeanInput) * 100) : 0
        
        monthlySummaries.push({
          month: format(month, 'MM/yyyy', { locale: vi }),
          year: month.getFullYear(),
          totalSoybeanInput,
          totalTofuCollected,
          totalTofuOutput,
          totalTofuRemaining,
          processingEfficiency
        })
      }
      
      setMonthlyTofuSummary(monthlySummaries)
      
    } catch (error) {
      console.error('Error fetching monthly tofu summary:', error)
      
      // Fallback to sample data
      const currentDate = new Date()
      const sampleSummaries: MonthlyTofuSummary[] = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        sampleSummaries.push({
          month: format(date, 'MM/yyyy', { locale: vi }),
          year: date.getFullYear(),
          totalSoybeanInput: 3000 + Math.floor(Math.random() * 1000),
          totalTofuCollected: 2400 + Math.floor(Math.random() * 800),
          totalTofuOutput: 2200 + Math.floor(Math.random() * 600),
          totalTofuRemaining: 200 + Math.floor(Math.random() * 200),
          processingEfficiency: 75 + Math.floor(Math.random() * 20)
        })
      }
      
      setMonthlyTofuSummary(sampleSummaries)
    }
  }

  // Update daily tofu processing data
  const updateDailyTofuProcessing = async () => {
    if (!dailyTofuProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailyData(dailyTofuProcessing.date, {
        soybeanInput: dailyUpdateData.soybeanInput,
        tofuInput: dailyUpdateData.tofuInput,
        note: dailyUpdateData.note
      })

      // Refresh data
      await fetchDailyTofuProcessing(new Date(dailyTofuProcessing.date))
      await fetchWeeklyTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu chế biến đậu phụ",
      })

      setEditingDailyData(false)

    } catch (error) {
      console.error("Error updating daily tofu processing:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Load daily data when tofu section is active
  useEffect(() => {
    if (activeSection === "tofu") {
      fetchDailyTofuProcessing(new Date())
      fetchMonthlyTofuSummary()
      fetchWeeklyTracking()
    }
  }, [activeSection])

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

  // Add function to fetch daily sausage processing data
  const fetchDailySausageProcessing = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Get station manager input data
      let stationData = {
        porkLeanInput: 0,
        porkFatInput: 0,
        sausageInput: 0,
        fishCakeInput: 0,
        note: ""
      }
      
      try {
        const stationResponse = await processingStationApi.getDailySausageData(dateStr)
        if (stationResponse && stationResponse.data) {
          stationData = {
            porkLeanInput: stationResponse.data.porkLeanInput || 0,
            porkFatInput: stationResponse.data.porkFatInput || 0,
            sausageInput: stationResponse.data.sausageInput || 0,
            fishCakeInput: stationResponse.data.fishCakeInput || 0,
            note: stationResponse.data.note || ""
          }
        }
      } catch (error) {
        console.log("No sausage station data found for date, using defaults:", error)
      }

      // Get sausage output data from supply outputs API
      let sausageOutput = 0
      let fishCakeOutput = 0
      try {
        const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
          date: dateStr
        })
        const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
        
        // Calculate outputs
        sausageOutput = outputs
          .filter((output: any) => output.product?.name?.toLowerCase().includes("giò"))
          .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          
        fishCakeOutput = outputs
          .filter((output: any) => output.product?.name?.toLowerCase().includes("chả"))
          .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
      } catch (error) {
        console.log("No sausage output data found, using 0:", error)
      }

      const processingData: DailySausageProcessing = {
        date: dateStr,
        porkLeanInput: stationData.porkLeanInput,
        porkFatInput: stationData.porkFatInput,
        sausageInput: stationData.sausageInput,
        sausageOutput: sausageOutput,
        sausageRemaining: Math.max(0, stationData.sausageInput - sausageOutput),
        fishCakeInput: stationData.fishCakeInput,
        fishCakeOutput: fishCakeOutput,
        fishCakeRemaining: Math.max(0, stationData.fishCakeInput - fishCakeOutput),
        note: stationData.note
      }

      setDailySausageProcessing(processingData)
      setSausageUpdateData({
        porkLeanInput: stationData.porkLeanInput,
        porkFatInput: stationData.porkFatInput,
        sausageInput: stationData.sausageInput,
        fishCakeInput: stationData.fishCakeInput,
        note: stationData.note
      })

    } catch (error) {
      console.error("Error fetching daily sausage processing data:", error)
      
      // Set default data
      const defaultData: DailySausageProcessing = {
        date: format(date, "yyyy-MM-dd"),
        porkLeanInput: 0,
        porkFatInput: 0,
        sausageInput: 0,
        sausageOutput: 0,
        sausageRemaining: 0,
        fishCakeInput: 0,
        fishCakeOutput: 0,
        fishCakeRemaining: 0,
        note: ""
      }
      setDailySausageProcessing(defaultData)
      setSausageUpdateData({
        porkLeanInput: 0,
        porkFatInput: 0,
        sausageInput: 0,
        fishCakeInput: 0,
        note: ""
      })
    }
  }

  // Add function to fetch weekly sausage tracking data
  const fetchWeeklySausageTracking = async () => {
    try {
      const weekDates = getCurrentWeekDates()
      const weeklyData: WeeklySausageTracking[] = []

      for (const date of weekDates) {
        const dateStr = format(date, "yyyy-MM-dd")
        
        // Get station data
        let stationData = { 
          porkLeanInput: 0, 
          porkFatInput: 0, 
          sausageInput: 0, 
          fishCakeInput: 0 
        }
        try {
          const stationResponse = await processingStationApi.getDailySausageData(dateStr)
          if (stationResponse && stationResponse.data) {
            stationData = {
              porkLeanInput: stationResponse.data.porkLeanInput || 0,
              porkFatInput: stationResponse.data.porkFatInput || 0,
              sausageInput: stationResponse.data.sausageInput || 0,
              fishCakeInput: stationResponse.data.fishCakeInput || 0
            }
          }
        } catch (error) {
          // Use default values
        }

        // Get output data
        let sausageOutput = 0
        let fishCakeOutput = 0
        try {
          const outputsResponse = await supplyOutputsApi.getSupplyOutputs({
            date: dateStr
          })
          const outputs = Array.isArray(outputsResponse) ? outputsResponse : (outputsResponse as any).data || []
          sausageOutput = outputs
            .filter((output: any) => output.product?.name?.toLowerCase().includes("giò"))
            .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
          fishCakeOutput = outputs
            .filter((output: any) => output.product?.name?.toLowerCase().includes("chả"))
            .reduce((sum: number, output: any) => sum + (output.quantity || 0), 0)
        } catch (error) {
          // Use default values
        }

        weeklyData.push({
          date: dateStr,
          dayOfWeek: getDayName(date.getDay()),
          porkLeanInput: stationData.porkLeanInput,
          porkFatInput: stationData.porkFatInput,
          sausageInput: stationData.sausageInput,
          sausageOutput: sausageOutput,
          sausageRemaining: Math.max(0, stationData.sausageInput - sausageOutput),
          fishCakeInput: stationData.fishCakeInput,
          fishCakeOutput: fishCakeOutput,
          fishCakeRemaining: Math.max(0, stationData.fishCakeInput - fishCakeOutput)
        })
      }

      setWeeklySausageTracking(weeklyData)
    } catch (error) {
      console.error("Error fetching weekly sausage tracking data:", error)
      
      // Generate sample data for current week
      const weekDates = getCurrentWeekDates()
      const sampleWeeklyData: WeeklySausageTracking[] = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: getDayName(date.getDay()),
        porkLeanInput: 0,
        porkFatInput: 0,
        sausageInput: 0,
        sausageOutput: 0,
        sausageRemaining: 0,
        fishCakeInput: 0,
        fishCakeOutput: 0,
        fishCakeRemaining: 0
      }))
      setWeeklySausageTracking(sampleWeeklyData)
    }
  }

  // Add function to update daily sausage processing
  const updateDailySausageProcessing = async () => {
    if (!dailySausageProcessing) return

    try {
      setIsUpdating(true)

      // Update station data via API
      await processingStationApi.updateDailySausageData(dailySausageProcessing.date, {
        porkLeanInput: sausageUpdateData.porkLeanInput,
        porkFatInput: sausageUpdateData.porkFatInput,
        sausageInput: sausageUpdateData.sausageInput,
        fishCakeInput: sausageUpdateData.fishCakeInput,
        note: sausageUpdateData.note
      })

      // Refresh data
      await fetchDailySausageProcessing(new Date(dailySausageProcessing.date))
      await fetchWeeklySausageTracking()

      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu làm giò chả",
      })

      setEditingSausageData(false)

    } catch (error) {
      console.error("Error updating daily sausage processing:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Load daily data when tofu section is active
  useEffect(() => {
    if (activeSection === "tofu") {
      fetchDailyTofuProcessing(new Date())
      fetchMonthlyTofuSummary()
      fetchWeeklyTracking()
    }
  }, [activeSection])

  // Load daily data when sausage section is active
  useEffect(() => {
    if (activeSection === "sausage") {
      fetchDailySausageProcessing(new Date())
      fetchWeeklySausageTracking()
    }
  }, [activeSection])

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
              const isImplemented = ["tofu", "sausage", "livestock", "lttp"].includes(section.id)
              
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
                <h2 className="text-2xl font-bold text-green-800">Làm đậu phụ</h2>
                <Badge className="bg-green-100 text-green-800">
                  Chỉ do Trạm trưởng chỉnh sửa
                </Badge>
              </div>

              {/* Position 1: Daily Tofu Tracking - Current Day Values */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">
                    CHẾ BIẾN ĐẬU PHỤ
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-center">
                    Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoading || !dailyTofuProcessing ? (
                    <div className="text-center py-8">Đang tải dữ liệu...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Lãi trong ngày - Position 1 as requested */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-700 mb-2">🏆 LÃI TRONG NGÀY:</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {(() => {
                              // Tính toán lãi trong ngày - không fix cứng giá
                              // Cần lấy giá từ sản phẩm hoặc cấu hình, tạm thời để 0 để không tính sai
                              const tofuPrice = 0 // TODO: Lấy giá đậu phụ từ product hoặc setting
                              const soybeanPrice = 0 // TODO: Lấy giá đậu tương từ product hoặc setting
                              
                              const tofuRevenue = dailyTofuProcessing.tofuInput * tofuPrice
                              const soybeanCost = dailyTofuProcessing.soybeanInput * soybeanPrice
                              
                              const dailyProfit = tofuRevenue - soybeanCost
                              
                              // Nếu chưa có giá, hiển thị thông báo
                              if (tofuPrice === 0 || soybeanPrice === 0) {
                                return (
                                  <span className="text-gray-500 text-xl">
                                    Chưa cấu hình giá
                                  </span>
                                )
                              }
                              
                              return (
                                <span className={dailyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                                  {dailyProfit >= 0 ? "+" : ""}{dailyProfit.toLocaleString()}
                                </span>
                              )
                            })()}
                            <span className="text-lg ml-1">đ</span>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            (Cần cấu hình giá đậu phụ và đậu tương)
                          </div>
                        </div>
                      </div>

                      {/* Four box layout as per requirement */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Đậu tương chi */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-green-700 mb-2">Đậu tương chi:</div>
                            <div className="text-2xl font-bold text-green-800">
                              {editingDailyData ? (
                                <Input
                                  type="number"
                                  value={dailyUpdateData.soybeanInput}
                                  onChange={(e) => setDailyUpdateData(prev => ({ 
                                    ...prev, 
                                    soybeanInput: Number(e.target.value) || 0
                                  }))}
                                  className="w-24 h-12 text-center text-2xl font-bold bg-white border-green-300"
                                  placeholder="0"
                                />
                              ) : (
                                <span>{dailyTofuProcessing.soybeanInput}</span>
                              )}
                              <span className="text-lg ml-1">kg</span>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              (Trạm trưởng nhập tay)
                            </div>
                          </div>
                        </div>

                        {/* Đậu phụ thu */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-yellow-700 mb-2">Đậu phụ thu:</div>
                            <div className="text-2xl font-bold text-yellow-800">
                              {editingDailyData ? (
                                <Input
                                  type="number"
                                  value={dailyUpdateData.tofuInput}
                                  onChange={(e) => setDailyUpdateData(prev => ({ 
                                    ...prev, 
                                    tofuInput: Number(e.target.value) || 0
                                  }))}
                                  className="w-24 h-12 text-center text-2xl font-bold bg-white border-yellow-300"
                                  placeholder="0"
                                />
                              ) : (
                                <span>{dailyTofuProcessing.tofuInput}</span>
                              )}
                              <span className="text-lg ml-1">kg</span>
                            </div>
                            <div className="text-xs text-yellow-600 mt-1">
                              (Trạm trưởng nhập tay)
                            </div>
                          </div>
                        </div>

                        {/* Đậu phụ xuất */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-red-700 mb-2">Đậu phụ xuất:</div>
                            <div className="text-2xl font-bold text-red-800">
                              <span>{dailyTofuProcessing.tofuOutput}</span>
                              <span className="text-lg ml-1">kg</span>
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              (Thực tế đã xuất trong ngày)
                            </div>
                          </div>
                        </div>

                        {/* Đậu phụ tồn */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-purple-700 mb-2">Đậu phụ tồn:</div>
                            <div className="text-2xl font-bold text-purple-800">
                              <span>{dailyTofuProcessing.tofuRemaining}</span>
                              <span className="text-lg ml-1">kg</span>
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              (Thu - Xuất = {dailyTofuProcessing.tofuInput} - {dailyTofuProcessing.tofuOutput})
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes section */}
                      {editingDailyData && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Ghi chú:</label>
                          <textarea
                            value={dailyUpdateData.note}
                            onChange={(e) => setDailyUpdateData(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={2}
                            placeholder="Ghi chú về quá trình chế biến trong ngày"
                          />
                        </div>
                      )}

                      {dailyTofuProcessing.note && !editingDailyData && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                          <div className="text-sm text-gray-600 mt-1">{dailyTofuProcessing.note}</div>
                        </div>
                      )}

                      {/* Edit Controls for Station Manager */}
                      {(user?.role === 'stationManager' || user?.role === 'admin') && (
                        <div className="flex items-center justify-end gap-2 pt-4 border-t">
                          {editingDailyData ? (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setEditingDailyData(false)
                                  setDailyUpdateData({
                                    soybeanInput: dailyTofuProcessing.soybeanInput,
                                    tofuInput: dailyTofuProcessing.tofuInput,
                                    note: dailyTofuProcessing.note || ""
                                  })
                                }}
                              >
                                Hủy
                              </Button>
                              <Button onClick={updateDailyTofuProcessing} disabled={isUpdating}>
                                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline"
                              onClick={() => setEditingDailyData(true)}
                            >
                              Chỉnh sửa
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Info message for other roles */}
                      {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500 text-center">
                            Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu chế biến đậu phụ
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Position 2: Weekly Tracking Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">
                    BẢNG THEO DÕI CHẾ BIẾN ĐẬU PHỤ THEO TUẦN
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-center">
                    Ngày hôm nay: {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoading || weeklyTracking.length === 0 ? (
                    <div className="text-center py-8">Đang tải dữ liệu tuần...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-3 text-center font-bold">Ngày</th>
                              <th className="border border-gray-300 p-3 text-center font-bold">Thứ</th>
                              <th className="border border-gray-300 p-3 text-center font-bold bg-green-50">
                                Đậu tương chi<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-3 text-center font-bold bg-yellow-50">
                                Đậu phụ thu<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-3 text-center font-bold bg-red-50">
                                Đậu phụ đã xuất<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-3 text-center font-bold bg-purple-50">
                                Đậu phụ tồn<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {weeklyTracking.map((day, index) => {
                              const isToday = format(new Date(), "yyyy-MM-dd") === day.date
                              return (
                                <tr key={index} className={isToday ? "bg-blue-50 font-semibold" : ""}>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {format(new Date(day.date), "dd/MM", { locale: vi })}
                                    {isToday && <div className="text-xs text-blue-600">(Hôm nay)</div>}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {day.dayOfWeek}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-green-25">
                                    <span className="font-semibold text-green-700">
                                      {day.soybeanInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-yellow-25">
                                    <span className="font-semibold text-yellow-700">
                                      {day.tofuInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-red-25">
                                    <span className="font-semibold text-red-700">
                                      {day.tofuOutput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-purple-25">
                                    <span className="font-semibold text-purple-700">
                                      {day.tofuRemaining.toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                            
                            {/* Weekly Total Row */}
                            <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                              <td colSpan={2} className="border border-gray-300 p-2 text-center">
                                TỔNG TUẦN
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-green-100">
                                <span className="text-green-800">
                                  {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-yellow-100">
                                <span className="text-yellow-800">
                                  {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-red-100">
                                <span className="text-red-800">
                                  {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-purple-100">
                                <span className="text-purple-800">
                                  {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-green-600">Tổng đậu tương chi</div>
                          <div className="text-lg font-bold text-green-700">
                            {weeklyTracking.reduce((sum, day) => sum + day.soybeanInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="text-xs text-yellow-600">Tổng đậu phụ thu</div>
                          <div className="text-lg font-bold text-yellow-700">
                            {weeklyTracking.reduce((sum, day) => sum + day.tofuInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <div className="text-xs text-red-600">Tổng đậu phụ đã xuất</div>
                          <div className="text-lg font-bold text-red-700">
                            {weeklyTracking.reduce((sum, day) => sum + day.tofuOutput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="text-xs text-purple-600">Tổng đậu phụ tồn</div>
                          <div className="text-lg font-bold text-purple-700">
                            {weeklyTracking.reduce((sum, day) => sum + day.tofuRemaining, 0).toLocaleString()} kg
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Position 3: Monthly Summary - Bảng LÀM ĐẬU PHỤ theo tháng */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">
                    LÀM ĐẬU PHỤ - TỔNG HỢP THEO THÁNG
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-center">
                    Bảng thu chi lãi theo từng tháng trong năm {new Date().getFullYear()}
                  </p>
                </CardHeader>
                <CardContent>
                  {monthlyTofuSummary.length === 0 ? (
                    <div className="text-center py-8">Đang tải dữ liệu tháng...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Monthly Table as per design */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-black">
                          <thead>
                            <tr>
                              <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">THÁNG</th>
                              <th colSpan={3} className="border border-black p-2 bg-green-100 font-bold">THU</th>
                              <th colSpan={3} className="border border-black p-2 bg-red-100 font-bold">CHI</th>
                              <th rowSpan={3} className="border border-black p-2 bg-blue-100 font-bold">THU-<br/>CHI<br/>(LÃI)</th>
                            </tr>
                            <tr>
                              <th colSpan={2} className="border border-black p-1 bg-green-50 text-sm">Đậu phụ</th>
                              <th rowSpan={2} className="border border-black p-1 bg-green-50 text-sm">Sản<br/>phẩm<br/>phụ<br/>(1.000đ)</th>
                              <th colSpan={2} className="border border-black p-1 bg-red-50 text-sm">Đậu tương</th>
                              <th rowSpan={2} className="border border-black p-1 bg-red-50 text-sm">Chi khác<br/>(1.000đ)</th>
                            </tr>
                            <tr>
                              <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                              <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                              <th className="border border-black p-1 text-xs">Số lượng<br/>(kg)</th>
                              <th className="border border-black p-1 text-xs">Thành<br/>Tiền<br/>(1.000đ)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTofuSummary.map((month, index) => (
                              <tr key={index} className={index === monthlyTofuSummary.length - 1 ? "bg-blue-50" : ""}>
                                <td className="border border-black p-2 font-medium text-center">
                                  {month.month}
                                  {index === monthlyTofuSummary.length - 1 && (
                                    <div className="text-xs text-blue-600 mt-1">(Hiện tại)</div>
                                  )}
                                </td>
                                {/* THU - Đậu phụ */}
                                <td className="border border-black p-1 text-center font-semibold text-green-600">
                                  {month.totalTofuCollected.toLocaleString()}
                                </td>
                                <td className="border border-black p-1 text-center font-semibold text-green-600">
                                  {(month.totalTofuCollected * 15).toLocaleString()}
                                </td>
                                {/* THU - Sản phẩm phụ */}
                                <td className="border border-black p-1 text-center font-semibold text-green-600">
                                  {Math.round(month.totalTofuCollected * 0.1 * 5).toLocaleString()}
                                </td>
                                {/* CHI - Đậu tương */}
                                <td className="border border-black p-1 text-center font-semibold text-red-600">
                                  {month.totalSoybeanInput.toLocaleString()}
                                </td>
                                <td className="border border-black p-1 text-center font-semibold text-red-600">
                                  {(month.totalSoybeanInput * 12).toLocaleString()}
                                </td>
                                {/* CHI - Chi khác */}
                                <td className="border border-black p-1 text-center font-semibold text-red-600">
                                  {Math.round(month.totalSoybeanInput * 0.02 * 1000).toLocaleString()}
                                </td>
                                {/* THU-CHI (LÃI) */}
                                <td className="border border-black p-1 text-center bg-blue-50">
                                  <span className={`font-bold ${
                                    ((month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                                     (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)) >= 0 
                                    ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {(
                                      (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5) - 
                                      (month.totalSoybeanInput * 12) - Math.round(month.totalSoybeanInput * 0.02 * 1000)
                                    ).toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Total Row */}
                            <tr className="bg-yellow-100 font-bold border-t-2 border-black">
                              <td className="border border-black p-2 text-center font-bold">
                                TỔNG NĂM
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-green-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + month.totalTofuCollected, 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-green-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + (month.totalTofuCollected * 15), 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-green-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + Math.round(month.totalTofuCollected * 0.1 * 5), 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-red-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + month.totalSoybeanInput, 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-red-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + (month.totalSoybeanInput * 12), 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center font-bold text-red-700">
                                {monthlyTofuSummary.reduce((sum, month) => sum + Math.round(month.totalSoybeanInput * 0.02 * 1000), 0).toLocaleString()}
                              </td>
                              <td className="border border-black p-1 text-center bg-blue-100">
                                <span className="font-bold text-blue-700">
                                  {monthlyTofuSummary.reduce((sum, month) => {
                                    const revenue = (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5)
                                    const cost = (month.totalSoybeanInput * 12) + Math.round(month.totalSoybeanInput * 0.02 * 1000)
                                    return sum + (revenue - cost)
                                  }, 0).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Notes section */}
                      <div className="border-t-2 border-black p-3 bg-gray-50">
                        <p className="text-sm font-medium mb-2">Cộng tháng trước chuyển sang</p>
                        <p className="text-xs text-gray-600">
                          Ngày thứ nhất đầu tháng là cộng lượng tồn của tháng và lượng làm trong ngày
                        </p>
                      </div>

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-sm text-green-600">Tổng thu (cả năm)</div>
                          <div className="text-lg font-bold text-green-700">
                            {monthlyTofuSummary.reduce((sum, month) => {
                              return sum + (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5)
                            }, 0).toLocaleString()}.000đ
                          </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="text-sm text-red-600">Tổng chi (cả năm)</div>
                          <div className="text-lg font-bold text-red-700">
                            {monthlyTofuSummary.reduce((sum, month) => {
                              return sum + (month.totalSoybeanInput * 12) + Math.round(month.totalSoybeanInput * 0.02 * 1000)
                            }, 0).toLocaleString()}.000đ
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-600">Lãi ròng (cả năm)</div>
                          <div className="text-lg font-bold text-blue-700">
                            {monthlyTofuSummary.reduce((sum, month) => {
                              const revenue = (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5)
                              const cost = (month.totalSoybeanInput * 12) + Math.round(month.totalSoybeanInput * 0.02 * 1000)
                              return sum + (revenue - cost)
                            }, 0).toLocaleString()}.000đ
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="text-sm text-purple-600">Tỷ suất lợi nhuận</div>
                          <div className="text-lg font-bold text-purple-700">
                            {(() => {
                              const totalRevenue = monthlyTofuSummary.reduce((sum, month) => {
                                return sum + (month.totalTofuCollected * 15) + Math.round(month.totalTofuCollected * 0.1 * 5)
                              }, 0)
                              const totalCost = monthlyTofuSummary.reduce((sum, month) => {
                                return sum + (month.totalSoybeanInput * 12) + Math.round(month.totalSoybeanInput * 0.02 * 1000)
                              }, 0)
                              return totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0
                            })()}%
                          </div>
                        </div>
                      </div>
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

          {activeSection === "sausage" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-orange-800">Làm giò chả</h2>
                <Badge className="bg-orange-100 text-orange-800">
                  Quản lý làm giò chả
                </Badge>
              </div>

              {/* Position 1: Daily Sausage Processing - Current Day Values */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">
                    LÀM GIÒ CHẢ
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-center">
                    Bảng theo dõi ngày hiện tại - {format(new Date(), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoading || !dailySausageProcessing ? (
                    <div className="text-center py-8">Đang tải dữ liệu...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Two section layout as per requirement */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Giò lụa section */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-blue-800 text-center mb-4">GIÒ LỤA</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Thịt nạc chi */}
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-green-700 mb-1">thịt nạc chi:</div>
                                <div className="text-lg font-bold text-green-800">
                                  {editingSausageData ? (
                                    <Input
                                      type="number"
                                      value={sausageUpdateData.porkLeanInput}
                                      onChange={(e) => setSausageUpdateData(prev => ({ 
                                        ...prev, 
                                        porkLeanInput: Number(e.target.value) || 0
                                      }))}
                                      className="w-16 h-8 text-center text-lg font-bold bg-white border-green-300"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span>{dailySausageProcessing.porkLeanInput}</span>
                                  )}
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Giò lụa xuất */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-yellow-700 mb-1">giò lụa xuất:</div>
                                <div className="text-lg font-bold text-yellow-800">
                                  <span>{dailySausageProcessing.sausageOutput}</span>
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Thịt mỡ chi */}
                            <div className="bg-orange-50 border border-orange-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-orange-700 mb-1">thịt mỡ chi:</div>
                                <div className="text-lg font-bold text-orange-800">
                                  {editingSausageData ? (
                                    <Input
                                      type="number"
                                      value={sausageUpdateData.porkFatInput}
                                      onChange={(e) => setSausageUpdateData(prev => ({ 
                                        ...prev, 
                                        porkFatInput: Number(e.target.value) || 0
                                      }))}
                                      className="w-16 h-8 text-center text-lg font-bold bg-white border-orange-300"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span>{dailySausageProcessing.porkFatInput}</span>
                                  )}
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Giò lụa tồn */}
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-red-700 mb-1">giò lụa tồn:</div>
                                <div className="text-lg font-bold text-red-800">
                                  <span>{dailySausageProcessing.sausageRemaining}</span>
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Giò lụa thu - full width */}
                            <div className="col-span-2 bg-purple-50 border border-purple-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-purple-700 mb-1">giò lụa thu:</div>
                                <div className="text-xl font-bold text-purple-800">
                                  {editingSausageData ? (
                                    <Input
                                      type="number"
                                      value={sausageUpdateData.sausageInput}
                                      onChange={(e) => setSausageUpdateData(prev => ({ 
                                        ...prev, 
                                        sausageInput: Number(e.target.value) || 0
                                      }))}
                                      className="w-20 h-10 text-center text-xl font-bold bg-white border-purple-300"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span>{dailySausageProcessing.sausageInput}</span>
                                  )}
                                  <span className="text-lg ml-1">kg</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chả quế section */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-amber-800 text-center mb-4">CHẢ QUÉ</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Thịt nạc chi */}
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-green-700 mb-1">thịt nạc chi:</div>
                                <div className="text-lg font-bold text-green-800">
                                  <span>{dailySausageProcessing.porkLeanInput}</span>
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">(Dùng chung)</div>
                              </div>
                            </div>

                            {/* Chả quế xuất */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-yellow-700 mb-1">chả quế xuất:</div>
                                <div className="text-lg font-bold text-yellow-800">
                                  <span>{dailySausageProcessing.fishCakeOutput}</span>
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Chả quế thu */}
                            <div className="bg-pink-50 border border-pink-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-pink-700 mb-1">chả quế thu:</div>
                                <div className="text-lg font-bold text-pink-800">
                                  {editingSausageData ? (
                                    <Input
                                      type="number"
                                      value={sausageUpdateData.fishCakeInput}
                                      onChange={(e) => setSausageUpdateData(prev => ({ 
                                        ...prev, 
                                        fishCakeInput: Number(e.target.value) || 0
                                      }))}
                                      className="w-16 h-8 text-center text-lg font-bold bg-white border-pink-300"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span>{dailySausageProcessing.fishCakeInput}</span>
                                  )}
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Chả quế tồn */}
                            <div className="bg-purple-50 border border-purple-200 rounded p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-purple-700 mb-1">chả quế tồn:</div>
                                <div className="text-lg font-bold text-purple-800">
                                  <span>{dailySausageProcessing.fishCakeRemaining}</span>
                                  <span className="text-sm ml-1">kg</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes section */}
                      {editingSausageData && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Ghi chú:</label>
                          <textarea
                            value={sausageUpdateData.note}
                            onChange={(e) => setSausageUpdateData(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={2}
                            placeholder="Ghi chú về quá trình làm giò chả trong ngày"
                          />
                        </div>
                      )}

                      {dailySausageProcessing.note && !editingSausageData && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-sm font-medium text-gray-700">Ghi chú:</div>
                          <div className="text-sm text-gray-600 mt-1">{dailySausageProcessing.note}</div>
                        </div>
                      )}

                      {/* Edit Controls for Station Manager */}
                      {(user?.role === 'stationManager' || user?.role === 'admin') && (
                        <div className="flex items-center justify-end gap-2 pt-4 border-t">
                          {editingSausageData ? (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setEditingSausageData(false)
                                  setSausageUpdateData({
                                    porkLeanInput: dailySausageProcessing.porkLeanInput,
                                    porkFatInput: dailySausageProcessing.porkFatInput,
                                    sausageInput: dailySausageProcessing.sausageInput,
                                    fishCakeInput: dailySausageProcessing.fishCakeInput,
                                    note: dailySausageProcessing.note || ""
                                  })
                                }}
                              >
                                Hủy
                              </Button>
                              <Button onClick={updateDailySausageProcessing} disabled={isUpdating}>
                                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline"
                              onClick={() => setEditingSausageData(true)}
                            >
                              Chỉnh sửa
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Info message for other roles */}
                      {user?.role && !['stationManager', 'admin'].includes(user.role) && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500 text-center">
                            Chỉ Trạm trưởng mới có thể chỉnh sửa dữ liệu làm giò chả
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Position 2: Weekly Tracking Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">
                    BẢNG THEO DÕI LÀM GIÒ CHẢ THEO TUẦN
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-center">
                    Ngày hôm nay: {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoading || weeklySausageTracking.length === 0 ? (
                    <div className="text-center py-8">Đang tải dữ liệu tuần...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-center font-bold">Ngày</th>
                              <th className="border border-gray-300 p-2 text-center font-bold">Thứ</th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-green-50">
                                Thịt nạc chi<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-orange-50">
                                Thịt mỡ chi<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-blue-50">
                                Giò lụa thu<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-yellow-50">
                                Giò lụa xuất<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-red-50">
                                Giò lụa tồn<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-pink-50">
                                Chả quế thu<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-amber-50">
                                Chả quế xuất<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                              <th className="border border-gray-300 p-2 text-center font-bold bg-purple-50">
                                Chả quế tồn<br/><span className="text-xs font-normal">(kg)</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {weeklySausageTracking.map((day, index) => {
                              const isToday = format(new Date(), "yyyy-MM-dd") === day.date
                              return (
                                <tr key={index} className={isToday ? "bg-blue-50 font-semibold" : ""}>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {format(new Date(day.date), "dd/MM", { locale: vi })}
                                    {isToday && <div className="text-xs text-blue-600">(Hôm nay)</div>}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {day.dayOfWeek}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-green-25">
                                    <span className="font-semibold text-green-700">
                                      {day.porkLeanInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-orange-25">
                                    <span className="font-semibold text-orange-700">
                                      {day.porkFatInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-blue-25">
                                    <span className="font-semibold text-blue-700">
                                      {day.sausageInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-yellow-25">
                                    <span className="font-semibold text-yellow-700">
                                      {day.sausageOutput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-red-25">
                                    <span className="font-semibold text-red-700">
                                      {day.sausageRemaining.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-pink-25">
                                    <span className="font-semibold text-pink-700">
                                      {day.fishCakeInput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-amber-25">
                                    <span className="font-semibold text-amber-700">
                                      {day.fishCakeOutput.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center bg-purple-25">
                                    <span className="font-semibold text-purple-700">
                                      {day.fishCakeRemaining.toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                            
                            {/* Weekly Total Row */}
                            <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                              <td colSpan={2} className="border border-gray-300 p-2 text-center">
                                TỔNG TUẦN
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-green-100">
                                <span className="text-green-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.porkLeanInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-orange-100">
                                <span className="text-orange-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.porkFatInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-blue-100">
                                <span className="text-blue-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.sausageInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-yellow-100">
                                <span className="text-yellow-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.sausageOutput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-red-100">
                                <span className="text-red-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.sausageRemaining, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-pink-100">
                                <span className="text-pink-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.fishCakeInput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-amber-100">
                                <span className="text-amber-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.fishCakeOutput, 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-2 text-center bg-purple-100">
                                <span className="text-purple-800">
                                  {weeklySausageTracking.reduce((sum, day) => sum + day.fishCakeRemaining, 0).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-green-600">Tổng thịt nạc chi</div>
                          <div className="text-lg font-bold text-green-700">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.porkLeanInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="text-xs text-orange-600">Tổng thịt mỡ chi</div>
                          <div className="text-lg font-bold text-orange-700">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.porkFatInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600">Tổng giò lụa thu</div>
                          <div className="text-lg font-bold text-blue-700">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.sausageInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600">Tổng chả quế thu</div>
                          <div className="text-lg font-bold text-pink-700">
                            {weeklySausageTracking.reduce((sum, day) => sum + day.fishCakeInput, 0).toLocaleString()} kg
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="text-xs text-purple-600">Tổng tồn kho</div>
                          <div className="text-lg font-bold text-purple-700">
                            {(weeklySausageTracking.reduce((sum, day) => sum + day.sausageRemaining, 0) + 
                              weeklySausageTracking.reduce((sum, day) => sum + day.fishCakeRemaining, 0)).toLocaleString()} kg
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date Filter */}
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <label htmlFor="sausage-date" className="font-medium text-sm">
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
                          id="sausage-date"
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
