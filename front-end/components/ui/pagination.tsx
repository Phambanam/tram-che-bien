import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

interface PaginationProps {
  className?: string
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ className, totalPages, currentPage, onPageChange }: PaginationProps) {
  // Generate page numbers to display
  const generatePages = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust if we're near the start or end
      if (currentPage <= 3) {
        startPage = 2
        endPage = 4
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3
        endPage = totalPages - 1
      }
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pages.push("...")
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pages.push("...")
      }
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }
  
  const pages = generatePages()
  
  return (
    <nav
      className={cn("flex w-full items-center justify-center space-x-2", className)}
      aria-label="Pagination"
    >
      <PaginationItem disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Trang trước</span>
      </PaginationItem>
      
      {pages.map((page, i) => {
        if (page === "...") {
          return (
            <div key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Nhiều trang</span>
            </div>
          )
        }
        
        return (
          <PaginationItem
            key={`page-${page}`}
            isActive={page === currentPage}
            onClick={() => onPageChange(Number(page))}
          >
            {page}
          </PaginationItem>
        )
      })}
      
      <PaginationItem disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Trang sau</span>
      </PaginationItem>
    </nav>
  )
}

interface PaginationItemProps extends ButtonProps {
  isActive?: boolean
}

export function PaginationItem({
  className,
  isActive,
  disabled,
  children,
  ...props
}: PaginationItemProps) {
  return (
    <button
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "outline",
          size: "icon",
        }),
        "h-9 w-9",
        {
          "pointer-events-none opacity-50": disabled,
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
