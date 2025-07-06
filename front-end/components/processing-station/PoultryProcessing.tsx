"use client"

import { useState, useEffect } from "react"
import { getDayNameForWeekPosition } from "@/lib/date-utils"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PoultryRecord {
  date: string
  dayOfWeek: string
  livePoultryInput: number
  processedMeatOutput: number
  remainingStock: number
  livePoultryPrice: number
  processedMeatPrice: number
  note?: string
}

const getWeekDates = (date: Date = new Date()) => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is sunday
  const monday = new Date(date.setDate(diff))
  
  const weekDates = []
  for(let i = 0; i < 7; i++) {
    const currentDate = new Date(monday)
    currentDate.setDate(monday.getDate() + i)
    weekDates.push({
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: currentDate.toLocaleDateString('vi-VN', { weekday: 'long' })
    })
  }
  return weekDates
}

export function PoultryProcessing() {
  const [records, setRecords] = useState<PoultryRecord[]>([])
  const [newRecord, setNewRecord] = useState<PoultryRecord>({
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: new Date().toLocaleDateString('vi-VN', { weekday: 'long' }),
    livePoultryInput: 0,
    processedMeatOutput: 0,
    remainingStock: 0,
    livePoultryPrice: 0,
    processedMeatPrice: 0
  })

  useEffect(() => {
    // Initialize the week's records
    const weekDates = getWeekDates()
    const initialRecords = weekDates.map(({ date, dayOfWeek }) => ({
      date,
      dayOfWeek,
      livePoultryInput: 0,
      processedMeatOutput: 0,
      remainingStock: 0,
      livePoultryPrice: 60000, // Default price
      processedMeatPrice: 120000, // Default price
      note: ''
    }))
    setRecords(initialRecords)
  }, [])

  const handleInputChange = (field: keyof PoultryRecord, value: string) => {
    setNewRecord(prev => ({
      ...prev,
      [field]: field === 'date' || field === 'dayOfWeek' || field === 'note' 
        ? value 
        : Number(value)
    }))
  }

  const handleAddRecord = () => {
    // Update existing record if date matches, otherwise add new record
    setRecords(prev => {
      const existingIndex = prev.findIndex(r => r.date === newRecord.date)
      if (existingIndex >= 0) {
        return prev.map((record, index) => 
          index === existingIndex ? { ...record, ...newRecord } : record
        )
      }
      return [...prev, newRecord]
    })

    // Reset form but keep the current date
    setNewRecord(prev => ({
      ...prev,
      livePoultryInput: 0,
      processedMeatOutput: 0,
      remainingStock: 0,
      livePoultryPrice: 60000,
      processedMeatPrice: 120000,
      note: ''
    }))
  }

  // Calculate remaining stock based on previous day's stock
  const calculateRemainingStock = (index: number) => {
    if (index === 0) {
      return records[index].livePoultryInput - records[index].processedMeatOutput
    }
    return records[index - 1].remainingStock + 
           records[index].livePoultryInput - 
           records[index].processedMeatOutput
  }

  // Update remaining stock whenever records change
  useEffect(() => {
    if (records.length > 0) {
      const updatedRecords = records.map((record, index) => ({
        ...record,
        remainingStock: calculateRemainingStock(index)
      }))
      setRecords(updatedRecords)
    }
  }, [records.map(r => `${r.livePoultryInput}-${r.processedMeatOutput}`).join(',')])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">Nhập gia cầm sống</h3>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Số lượng (kg)"
              value={newRecord.livePoultryInput || ''}
              onChange={e => handleInputChange('livePoultryInput', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Đơn giá (VND)"
              value={newRecord.livePoultryPrice || ''}
              onChange={e => handleInputChange('livePoultryPrice', e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">Thành phẩm</h3>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Số lượng (kg)"
              value={newRecord.processedMeatOutput || ''}
              onChange={e => handleInputChange('processedMeatOutput', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Đơn giá (VND)"
              value={newRecord.processedMeatPrice || ''}
              onChange={e => handleInputChange('processedMeatPrice', e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">Thêm thông tin</h3>
          <div className="space-y-2">
            <Input
              type="date"
              value={newRecord.date}
              onChange={e => handleInputChange('date', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Ghi chú"
              value={newRecord.note || ''}
              onChange={e => handleInputChange('note', e.target.value)}
            />
            <Button 
              className="w-full"
              onClick={handleAddRecord}
            >
              Cập nhật bản ghi
            </Button>
          </div>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Thứ</TableHead>
            <TableHead>Nhập (kg)</TableHead>
            <TableHead>Thành phẩm (kg)</TableHead>
            <TableHead>Tồn kho (kg)</TableHead>
            <TableHead>Đơn giá nhập (VND)</TableHead>
            <TableHead>Đơn giá xuất (VND)</TableHead>
            <TableHead>Ghi chú</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => {
            const isToday = record.date === new Date().toISOString().split('T')[0]
            return (
              <TableRow key={index} className={isToday ? 'bg-blue-50' : ''}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{getDayNameForWeekPosition(index)}</TableCell>
                <TableCell>{record.livePoultryInput}</TableCell>
                <TableCell>{record.processedMeatOutput}</TableCell>
                <TableCell>{record.remainingStock}</TableCell>
                <TableCell>{record.livePoultryPrice.toLocaleString()}</TableCell>
                <TableCell>{record.processedMeatPrice.toLocaleString()}</TableCell>
                <TableCell>{record.note}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}