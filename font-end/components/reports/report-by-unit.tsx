"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Download, Search } from "lucide-react"

// Mock data
const reportData = [
  {
    id: 1,
    unit: "Tiểu đoàn 1",
    totalProducts: 15,
    totalSupplied: 750,
    totalReceived: 720,
    difference: 30,
    percentReceived: 96,
  },
  {
    id: 2,
    unit: "Tiểu đoàn 2",
    totalProducts: 12,
    totalSupplied: 620,
    totalReceived: 600,
    difference: 20,
    percentReceived: 97,
  },
  {
    id: 3,
    unit: "Tiểu đoàn 3",
    totalProducts: 18,
    totalSupplied: 850,
    totalReceived: 830,
    difference: 20,
    percentReceived: 98,
  },
  {
    id: 4,
    unit: "Lữ đoàn bộ",
    totalProducts: 8,
    totalSupplied: 350,
    totalReceived: 340,
    difference: 10,
    percentReceived: 97,
  },
]

const chartData = [
  {
    name: "Tiểu đoàn 1",
    "Cung cấp": 750,
    Nhận: 720,
  },
  {
    name: "Tiểu đoàn 2",
    "Cung cấp": 620,
    Nhận: 600,
  },
  {
    name: "Tiểu đoàn 3",
    "Cung cấp": 850,
    Nhận: 830,
  },
  {
    name: "Lữ đoàn bộ",
    "Cung cấp": 350,
    Nhận: 340,
  },
]

export function ReportByUnit() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row">
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
            <div className="text-2xl font-bold">53</div>
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
          <CardTitle>Biểu đồ thống kê theo đơn vị</CardTitle>
          <CardDescription>So sánh khối lượng cung cấp và nhận theo từng đơn vị</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Cung cấp" fill="#4ade80" />
                <Bar dataKey="Nhận" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Báo cáo chi tiết theo đơn vị</CardTitle>
            <CardDescription>Thông tin chi tiết về nguồn nhập theo từng đơn vị</CardDescription>
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
                <TableHead>Đơn vị</TableHead>
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
                  <TableCell>{row.unit}</TableCell>
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
