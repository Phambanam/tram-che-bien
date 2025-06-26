"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Beef } from "lucide-react"

export function LivestockProcessing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Beef className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-red-800">Giết mổ lợn</h2>
        <Badge className="bg-red-100 text-red-800">
          Quản lý phân phối thịt lợn
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng tổng hợp giết mổ và phân phối thịt lợn</CardTitle>
          <p className="text-sm text-gray-600">
            Theo dõi nhập - xuất - tồn thịt và sản phẩm gia súc cho các đơn vị
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