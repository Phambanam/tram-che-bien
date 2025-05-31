"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Download, Search } from "lucide-react"

// Mock data
const reportData = [
  {
    id: 1,
    category: "Rau",
    totalProducts: 20,
    totalSupplied: 950,
    totalReceived: 920,
    difference: 30,
    percentReceived: 97,
  },
  {
    id: 2,
    category: "Gia súc",
    totalProducts: 8,
    totalSupplied: 800,
    totalReceived: 780,
    difference: 20,
    percentReceived: 98,
  },
  {
    id: 3,
    category: "Gia cầm",
    totalProducts: 12,
    totalSupplied: 450,
    totalReceived: 440,
    difference: 10,
    percentReceived: 98,
  },
  {
    id: 4,
    category: "Hải sản",
    totalProducts: 10,
    totalSupplied: 300,
    totalReceived: 290,
    difference: 10,
    percentReceived: 97,
  },
  {
    id: 5,
    category: "Gia vị",
    totalProducts: 15,
    totalSupplied: 70,
    totalReceived: 60,
    difference: 10,
    percentReceived: 86,
  },
]

const chartData = [
  { name: "Rau", value: 950 },
  { name: "Gia súc", value: 800 },
  { name: "Gia cầm", value: 450 },
  { name: "Hải sản", value: 300 },
  { name: "Gia vị", value: 70 },
]

const COLORS = ["#4ade80", "#f97316", "#3b82f6", "#ec4899", "#a855f7"]

export function ReportByCategory() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [unit, setUnit] = useState("all")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="unit">Đơn vị</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger id="unit">
              <SelectValue placeholder="Chọn đơn vị" />
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
        <div className="grid flex-1 gap-2">
          <Label htmlFor="from-date">Từ ngày</Label>
          <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="grid flex-1 gap-2">
          <Label htmlFor="to-date">Đến ngày</Label>
          <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Lọc
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng số sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng khối lượng cung cấp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,570 kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng khối lượng nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,490 kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ nhận/cung cấp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ thống kê theo phân loại</CardTitle>
          <CardDescription>Tỷ lệ khối lượng cung cấp theo từng phân loại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Báo cáo chi tiết theo phân loại</CardTitle>
            <CardDescription>Thông tin chi tiết về nguồn nhập theo từng phân loại</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Số lượng sản phẩm</TableHead>
                <TableHead>Tổng cung cấp (kg)</TableHead>
                <TableHead>Tổng nhận (kg)</TableHead>
                <TableHead>Chênh lệch (kg)</TableHead>
                <TableHead>Tỷ lệ nhận (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.totalProducts}</TableCell>
                  <TableCell>{row.totalSupplied}</TableCell>
                  <TableCell>{row.totalReceived}</TableCell>
                  <TableCell>{row.difference}</TableCell>
                  <TableCell>{row.percentReceived}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
