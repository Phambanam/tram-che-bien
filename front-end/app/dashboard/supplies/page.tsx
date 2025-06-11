"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SuppliesTable } from "@/components/supplies/supplies-table"
import { SuppliesFilter } from "@/components/supplies/supplies-filter"
import { SupplyAddButton } from "@/components/supplies/supply-add-button"

type FilterParams = {
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
}

export default function SuppliesPage() {
  const [filters, setFilters] = useState<FilterParams>({})

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Quản lý nguồn nhập" text="Quản lý thông tin nguồn nhập quân nhu">
        <SupplyAddButton />
      </DashboardHeader>
      <div className="space-y-4">
        <SuppliesFilter onFilterChange={handleFilterChange} />
        <SuppliesTable filters={filters} />
      </div>
    </DashboardShell>
  )
}
