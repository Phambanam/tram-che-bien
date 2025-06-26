"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Utensils } from "lucide-react"

export function SausageProcessing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-orange-800">Làm giò chả</h2>
        <Badge className="bg-orange-100 text-orange-800">
          Quản lý làm giò chả
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng theo dõi làm giò chả</CardTitle>
          <p className="text-sm text-gray-600">
            Theo dõi sản xuất giò lụa và chả quế hàng ngày
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