"use client"

import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Product } from "@/types"

interface ProductSelectProps {
  products: Product[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const ITEMS_PER_PAGE = 10

export function ProductSelect({
  products,
  value,
  onValueChange,
  placeholder = "Chọn sản phẩm",
  disabled = false
}: ProductSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map(p => p.category?.name).filter(Boolean))
    )
    return uniqueCategories.sort()
  }, [products])

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)

  // Find selected product name for display
  const selectedProduct = products.find(p => p._id === value)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {selectedProduct && (
            <div className="flex items-center gap-2">
              <span>{selectedProduct.name}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedProduct.category?.name}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[400px] max-h-[400px]">
        {/* Search and filter header */}
        <div className="p-2 border-b space-y-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="h-6 text-xs"
            >
              Tất cả ({products.length})
            </Button>
            {categories.map(category => {
              const count = products.filter(p => p.category?.name === category).length
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-6 text-xs"
                >
                  {category} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        {/* Products list */}
        <div className="max-h-[200px] overflow-y-auto">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <SelectItem key={product._id} value={product._id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.category?.name} • {product.unit || 'kg'}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Không tìm thấy sản phẩm nào
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-2 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages} ({filteredProducts.length} sản phẩm)
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary info */}
        <div className="p-2 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground text-center">
            💡 Mẹo: Dùng từ khóa để tìm kiếm hoặc chọn danh mục để lọc
          </div>
        </div>
      </SelectContent>
    </Select>
  )
} 