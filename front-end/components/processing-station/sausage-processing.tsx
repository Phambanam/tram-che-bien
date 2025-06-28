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
          Chỉ do Trạm trưởng chỉnh sửa
        </Badge>
      </div>

      {/* Daily Sausage Processing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            CHẾ BIẾN GIÒ CHẢ
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Bảng theo dõi ngày hiện tại - {new Date().toLocaleDateString('vi-VN')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Lãi trong ngày */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-700 mb-2">
                  🏆 LÃI TRONG NGÀY:
                </div>
                <div className="text-3xl font-bold text-orange-900">
                  <span className="text-gray-500 text-xl">
                    Chưa có dữ liệu
                  </span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Cần nhập đầy đủ giá thịt và giò chả
                </div>
              </div>
            </div>

            {/* Two section layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Giò lụa section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 text-center mb-4">GIÒ LỤA</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Thịt nạc chi */}
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-700 mb-1">Thịt nạc chi:</div>
                      <div className="text-lg font-bold text-green-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Thịt mỡ chi */}
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-orange-700 mb-1">Thịt mỡ chi:</div>
                      <div className="text-lg font-bold text-orange-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa thu */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-700 mb-1">Giò lụa thu:</div>
                      <div className="text-lg font-bold text-blue-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Giò lụa tồn */}
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-700 mb-1">Giò lụa tồn:</div>
                      <div className="text-lg font-bold text-red-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chả quế section */}
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-pink-800 text-center mb-4">CHẢ QUẾ</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Chả quế thu */}
                  <div className="bg-pink-50 border border-pink-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-pink-700 mb-1">Chả quế thu:</div>
                      <div className="text-lg font-bold text-pink-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế xuất */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-amber-700 mb-1">Chả quế xuất:</div>
                      <div className="text-lg font-bold text-amber-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Chả quế tồn */}
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 col-span-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-700 mb-1">Chả quế tồn:</div>
                      <div className="text-lg font-bold text-purple-800">
                        <span>0</span>
                        <span className="text-sm ml-1">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info message */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center">
                Chức năng làm giò chả đang được phát triển. Hiện tại chỉ hiển thị giao diện mẫu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 