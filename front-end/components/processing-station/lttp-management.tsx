"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export function LttpManagement() {
  return (
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
              0 kg
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
              0 kg
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
              0 kg
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
              0%
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
          <div className="text-center py-8 text-gray-500">
            Chức năng đang được phát triển...
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 