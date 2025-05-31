"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"
import { useEffect } from "react"

interface Unit {
  _id: string
  name: string
}

interface ReportFilterProps {
  showUnitFilter?: boolean
  onFilterChange?: (filters: any) => void
}

export function ReportFilter({ showUnitFilter = true, onFilterChange }: ReportFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [units, setUnits] = useState<Unit[]>([])
  const [unit, setUnit] = useState(searchParams.get("unit") || "all")
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "")
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "")

  useEffect(() => {
    // Fetch units
    const fetchUnits = async () => {
      try {
        const response = await fetch("/api/units")
        if (response.ok) {
          const data = await response.json()
          setUnits(data)
        }
      } catch (error) {
        console.error("Error fetching units:", error)
      }
    }

    fetchUnits()
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (unit && unit !== "all") {
      params.set("unit", unit)
    }

    if (fromDate) {
      params.set("fromDate", fromDate)
    }

    if (toDate) {
      params.set("toDate", toDate)
    }

    const queryString = params.toString()

    if (onFilterChange) {
      onFilterChange({
        unit: unit !== "all" ? unit : null,
        fromDate: fromDate || null,
        toDate: toDate || null,
      })
    } else {
      router.push(`?${queryString}`)
    }
  }

  const handleReset = () => {
    setUnit("all")
    setFromDate("")
    setToDate("")

    if (onFilterChange) {
      onFilterChange({
        unit: null,
        fromDate: null,
        toDate: null,
      })
    } else {
      router.push("")
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {showUnitFilter && (
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select value={unit} onValueChange={setUnit}>
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
          )}
          <div className="grid gap-2">
            <Label htmlFor="from-date">Từ ngày</Label>
            <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to-date">Đến ngày</Label>
            <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          Đặt lại
        </Button>
        <Button size="sm" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Lọc
        </Button>
      </CardFooter>
    </Card>
  )
}
