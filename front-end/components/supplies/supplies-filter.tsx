"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"

export function SuppliesFilter() {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Tìm kiếm và lọc</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Tất cả đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn vị</SelectItem>
                  <SelectItem value="tieu-doan-1">Tiểu đoàn 1</SelectItem>
                  <SelectItem value="tieu-doan-2">Tiểu đoàn 2</SelectItem>
                  <SelectItem value="tieu-doan-3">Tiểu đoàn 3</SelectItem>
                  <SelectItem value="lu-doan-bo">Lữ đoàn bộ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Phân loại</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Tất cả phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phân loại</SelectItem>
                  <SelectItem value="rau">Rau</SelectItem>
                  <SelectItem value="gia-suc">Gia súc</SelectItem>
                  <SelectItem value="gia-cam">Gia cầm</SelectItem>
                  <SelectItem value="hai-san">Hải sản</SelectItem>
                  <SelectItem value="gia-vi">Gia vị</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                  <SelectItem value="approved">Đã phê duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {expanded && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="product">Sản phẩm</Label>
                <Input id="product" placeholder="Nhập tên sản phẩm" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from-date">Từ ngày</Label>
                <Input id="from-date" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to-date">Đến ngày</Label>
                <Input id="to-date" type="date" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Thu gọn
            </>
          ) : (
            <>Mở rộng</>
          )}
        </Button>
        <Button size="sm">
          <Search className="mr-2 h-4 w-4" />
          Tìm kiếm
        </Button>
      </CardFooter>
    </Card>
  )
}
