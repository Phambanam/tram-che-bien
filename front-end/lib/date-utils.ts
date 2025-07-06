import { format, getWeek, startOfWeek, addDays, getISOWeek } from 'date-fns'
import { vi } from 'date-fns/locale'

// Helper function to get current week of year (ISO week)
export const getCurrentWeekOfYear = (date: Date = new Date()) => {
  return getWeek(date, { weekStartsOn: 1 }) // ISO week starts on Monday
}

// Helper function to get current ISO week
export const getCurrentISOWeek = (date: Date = new Date()) => {
  return getISOWeek(date)
}

// Get all dates in a specific week
export const getWeekDates = (week: number, year: number) => {
  // Simple approach: calculate approximate date and then find the correct week
  const startOfYear = new Date(year, 0, 1)
  const approximateDate = addDays(startOfYear, (week - 1) * 7)
  
  // Find the Monday of the week that contains our approximate date
  const monday = startOfWeek(approximateDate, { weekStartsOn: 1 })
  
  // Adjust if we're not in the right week yet
  let currentMonday = monday
  let attempts = 0
  while (getWeek(currentMonday, { weekStartsOn: 1 }) !== week && attempts < 10) {
    if (getWeek(currentMonday, { weekStartsOn: 1 }) < week) {
      currentMonday = addDays(currentMonday, 7)
    } else {
      currentMonday = addDays(currentMonday, -7)
    }
    attempts++
  }
  
  // Generate all 7 days of the week
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(currentMonday, i))
  }
  
  return weekDates
}

// Get current week dates (today's week)
export const getCurrentWeekDates = () => {
  const today = new Date()
  const currentWeek = getCurrentWeekOfYear(today)
  const currentYear = today.getFullYear()
  
  return getWeekDates(currentWeek, currentYear)
}

// Get day name in Vietnamese
export const getDayName = (dayIndex: number) => {
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
  return days[dayIndex]
}

// Get day name from date
export const getDayNameFromDate = (date: Date) => {
  return getDayName(date.getDay())
}

// Format date for display
export const formatDate = (date: Date, pattern: string = "dd/MM/yyyy") => {
  return format(date, pattern, { locale: vi })
}

// Format date for API
export const formatDateForAPI = (date: Date) => {
  return format(date, "yyyy-MM-dd")
}

// Get month name in Vietnamese
export const getMonthName = (monthIndex: number) => {
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ]
  return months[monthIndex]
}

// Get weeks in year
export const getWeeksInYear = (year: number) => {
  const lastDateOfYear = new Date(year, 11, 31)
  return getCurrentWeekOfYear(lastDateOfYear)
}

// Validate week number
export const isValidWeek = (week: number, year: number) => {
  const maxWeeks = getWeeksInYear(year)
  return week >= 1 && week <= maxWeeks
}

// Get date range for a specific week
export const getWeekDateRange = (week: number, year: number) => {
  const dates = getWeekDates(week, year)
  const startDate = dates[0]
  const endDate = dates[6]
  
  return {
    start: startDate,
    end: endDate,
    startFormatted: formatDate(startDate),
    endFormatted: formatDate(endDate)
  }
} 