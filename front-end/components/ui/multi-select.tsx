"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Option {
  value: string
  label: string
  [key: string]: any
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Chọn...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  console.log("options", options)
  
  // CSS for forcing scrollbar visibility on macOS
  const scrollbarStyles = `
    .scrollbar-always-visible {
      -webkit-overflow-scrolling: touch;
    }
    .scrollbar-always-visible::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .scrollbar-always-visible::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .scrollbar-always-visible::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    .scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `
  
  React.useEffect(() => {
    // Inject scrollbar styles
    const styleId = "multiselect-scrollbar-styles"
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      styleElement.textContent = scrollbarStyles
      document.head.appendChild(styleElement)
    }
    
    return () => {
      // Only remove if it exists and this is the last component
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [])
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  const handleClear = () => {
    onChange([])
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value))

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    return options.filter((option) => 
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Debug logging
  React.useEffect(() => {
    console.log("MultiSelect options count:", options.length)
    console.log("MultiSelect filtered options count:", filteredOptions.length)
    console.log("Search value:", searchValue)
    console.log("User agent:", navigator.userAgent)
    console.log("Is macOS:", navigator.userAgent.includes('Mac'))
  }, [options, filteredOptions, searchValue])

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSearchValue("") // Reset search when closing
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[2.5rem]", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedOptions.length === 1 ? (
              <span>{selectedOptions[0].label}</span>
            ) : (
              <>
                <Badge variant="secondary" className="mr-1">
                  {selectedOptions.length} đã chọn
                </Badge>
                {selectedOptions.slice(0, 2).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(option.value)
                    }}
                  >
                    {option.label}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="secondary">
                    +{selectedOptions.length - 2} khác
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 cursor-pointer opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <div className="flex flex-col max-h-[300px]">
          {/* Search Input */}
          <div className="p-2 border-b">
            <Input
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
              className="h-8"
            />
          </div>
          
          {/* Options List */}
          <div 
            className="flex-1 overflow-y-scroll max-h-[200px] min-h-[200px] scrollbar-always-visible" 
            style={{ 
              height: '200px', 
              overflowY: 'scroll',
              scrollbarWidth: 'thin', // Firefox
              scrollbarGutter: 'stable' // Modern browsers
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Không tìm thấy.
              </div>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 min-h-[32px]",
                      selected.includes(option.value) && "bg-blue-50"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                ))}
                {/* Force scroll by adding bottom padding when needed */}
                {filteredOptions.length > 6 && (
                  <div className="h-1" />
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 