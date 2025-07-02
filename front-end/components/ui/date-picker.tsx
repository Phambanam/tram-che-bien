"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ className, placeholder = "Chọn ngày", selected, onSelect }) {
  const [internalDate, setInternalDate] = React.useState(null)
  
  // Use controlled props if provided, otherwise use internal state
  const currentDate = selected !== undefined ? selected : internalDate
  const handleDateChange = onSelect !== undefined ? onSelect : setInternalDate

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[200px] justify-start text-left font-normal", !currentDate && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {currentDate ? format(currentDate, "dd/MM/yyyy", { locale: vi }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={currentDate} onSelect={handleDateChange} initialFocus locale={vi} />
      </PopoverContent>
    </Popover>
  )
}
