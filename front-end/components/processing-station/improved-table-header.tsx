import React from 'react'
import { TableHead, TableRow } from "@/components/ui/table"

interface ImprovedTableHeaderProps {
  type: 'livestock' | 'poultry' | 'sausage' | 'tofu' | 'salt'
  view: 'weekly' | 'monthly'
}

export function ImprovedTableHeader({ type, view }: ImprovedTableHeaderProps) {
  if (type === 'livestock') {
    return (
      <>
        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
          <TableHead className="text-center font-bold text-slate-700 w-24 border-r">
            {view === 'weekly' ? 'NGÀY' : 'THÁNG'}
          </TableHead>
          
          {/* Revenue Section */}
          <TableHead colSpan={5} className="text-center font-bold text-blue-700 bg-blue-50 border-r">
            📈 DOANH THU (1.000đ)
          </TableHead>
          
          {/* Cost Section */}
          <TableHead colSpan={3} className="text-center font-bold text-red-700 bg-red-50 border-r">
            📉 CHI PHÍ (1.000đ)
          </TableHead>
          
          {/* Profit Section */}
          <TableHead className="text-center font-bold text-green-700 bg-green-50">
            💰 LỢI NHUẬN
          </TableHead>
        </TableRow>
        
        <TableRow className="bg-white">
          <TableHead className="text-center text-slate-600 border-r">Thời gian</TableHead>
          
          {/* Revenue breakdown */}
          <TableHead className="text-center text-blue-600 bg-blue-25">Thịt nạc</TableHead>
          <TableHead className="text-center text-blue-600 bg-blue-25">Xương</TableHead>
          <TableHead className="text-center text-blue-600 bg-blue-25">Thịt xay</TableHead>
          <TableHead className="text-center text-blue-600 bg-blue-25">Lòng</TableHead>
          <TableHead className="text-center text-blue-600 bg-blue-25 border-r">Tổng thu</TableHead>
          
          {/* Cost breakdown */}
          <TableHead className="text-center text-red-600 bg-red-25">Lợn hơi</TableHead>
          <TableHead className="text-center text-red-600 bg-red-25">Chi khác</TableHead>
          <TableHead className="text-center text-red-600 bg-red-25 border-r">Tổng chi</TableHead>
          
          {/* Profit */}
          <TableHead className="text-center text-green-600 bg-green-25">Lãi/Lỗ</TableHead>
        </TableRow>
      </>
    )
  }

  if (type === 'poultry') {
    return (
      <>
        <TableRow className="bg-gradient-to-r from-purple-50 to-purple-100">
          <TableHead className="text-center font-bold text-slate-700 w-24 border-r">
            {view === 'weekly' ? 'NGÀY' : 'THÁNG'}
          </TableHead>
          
          <TableHead colSpan={3} className="text-center font-bold text-blue-700 bg-blue-50 border-r">
            📈 DOANH THU
          </TableHead>
          
          <TableHead colSpan={2} className="text-center font-bold text-red-700 bg-red-50 border-r">
            📉 CHI PHÍ
          </TableHead>
          
          <TableHead className="text-center font-bold text-green-700 bg-green-50">
            💰 LỢI NHUẬN
          </TableHead>
        </TableRow>
        
        <TableRow className="bg-white">
          <TableHead className="text-center text-slate-600 border-r">Thời gian</TableHead>
          
          <TableHead className="text-center text-blue-600">Thịt gia cầm (kg)</TableHead>
          <TableHead className="text-center text-blue-600">Giá trị (1.000đ)</TableHead>
          <TableHead className="text-center text-blue-600 border-r">Tổng thu</TableHead>
          
          <TableHead className="text-center text-red-600">Gia cầm sống (kg)</TableHead>
          <TableHead className="text-center text-red-600 border-r">Chi phí (1.000đ)</TableHead>
          
          <TableHead className="text-center text-green-600">Lãi/Lỗ</TableHead>
        </TableRow>
      </>
    )
  }

  if (type === 'sausage') {
    return (
      <>
        <TableRow className="bg-gradient-to-r from-orange-50 to-orange-100">
          <TableHead className="text-center font-bold text-slate-700 w-24 border-r">
            {view === 'weekly' ? 'NGÀY' : 'THÁNG'}
          </TableHead>
          
          <TableHead colSpan={3} className="text-center font-bold text-blue-700 bg-blue-50 border-r">
            📈 SẢN XUẤT GIÒCHẢ
          </TableHead>
          
          <TableHead colSpan={2} className="text-center font-bold text-red-700 bg-red-50 border-r">
            📉 NGUYÊN LIỆU
          </TableHead>
          
          <TableHead className="text-center font-bold text-green-700 bg-green-50">
            💰 HIỆU SUẤT
          </TableHead>
        </TableRow>
        
        <TableRow className="bg-white">
          <TableHead className="text-center text-slate-600 border-r">Thời gian</TableHead>
          
          <TableHead className="text-center text-blue-600">Giò chả (kg)</TableHead>
          <TableHead className="text-center text-blue-600">Đã xuất (kg)</TableHead>
          <TableHead className="text-center text-blue-600 border-r">Tồn kho (kg)</TableHead>
          
          <TableHead className="text-center text-red-600">Thịt nạc (kg)</TableHead>
          <TableHead className="text-center text-red-600 border-r">Thịt mỡ (kg)</TableHead>
          
          <TableHead className="text-center text-green-600">Tỷ lệ (%)</TableHead>
        </TableRow>
      </>
    )
  }

  if (type === 'tofu') {
    return (
      <>
        <TableRow className="bg-gradient-to-r from-green-50 to-green-100">
          <TableHead className="text-center font-bold text-slate-700 w-24 border-r">
            {view === 'weekly' ? 'NGÀY' : 'THÁNG'}
          </TableHead>
          
          <TableHead colSpan={3} className="text-center font-bold text-blue-700 bg-blue-50 border-r">
            📈 SẢN XUẤT ĐẬU PHỤ
          </TableHead>
          
          <TableHead colSpan={2} className="text-center font-bold text-red-700 bg-red-50 border-r">
            📉 NGUYÊN LIỆU
          </TableHead>
          
          <TableHead className="text-center font-bold text-green-700 bg-green-50">
            💰 HIỆU SUẤT
          </TableHead>
        </TableRow>
        
        <TableRow className="bg-white">
          <TableHead className="text-center text-slate-600 border-r">Thời gian</TableHead>
          
          <TableHead className="text-center text-blue-600">Đậu phụ (kg)</TableHead>
          <TableHead className="text-center text-blue-600">Đã xuất (kg)</TableHead>
          <TableHead className="text-center text-blue-600 border-r">Tồn kho (kg)</TableHead>
          
          <TableHead className="text-center text-red-600">Đậu tương (kg)</TableHead>
          <TableHead className="text-center text-red-600 border-r">Chi phí (1.000đ)</TableHead>
          
          <TableHead className="text-center text-green-600">Tỷ lệ (%)</TableHead>
        </TableRow>
      </>
    )
  }

  if (type === 'salt') {
    return (
      <>
        <TableRow className="bg-gradient-to-r from-cyan-50 to-cyan-100">
          <TableHead className="text-center font-bold text-slate-700 w-24 border-r">
            {view === 'weekly' ? 'NGÀY' : 'THÁNG'}
          </TableHead>
          
          <TableHead colSpan={3} className="text-center font-bold text-blue-700 bg-blue-50 border-r">
            📈 CHẾ BIẾN MUỐI
          </TableHead>
          
          <TableHead colSpan={2} className="text-center font-bold text-red-700 bg-red-50 border-r">
            📉 NGUYÊN LIỆU
          </TableHead>
          
          <TableHead className="text-center font-bold text-green-700 bg-green-50">
            💰 HIỆU SUẤT
          </TableHead>
        </TableRow>
        
        <TableRow className="bg-white">
          <TableHead className="text-center text-slate-600 border-r">Thời gian</TableHead>
          
          <TableHead className="text-center text-blue-600">Muối cải (kg)</TableHead>
          <TableHead className="text-center text-blue-600">Đã xuất (kg)</TableHead>
          <TableHead className="text-center text-blue-600 border-r">Tồn kho (kg)</TableHead>
          
          <TableHead className="text-center text-red-600">Rau cải (kg)</TableHead>
          <TableHead className="text-center text-red-600 border-r">Muối + gia vị</TableHead>
          
          <TableHead className="text-center text-green-600">Tỷ lệ (%)</TableHead>
        </TableRow>
      </>
    )
  }

  return null
}

// Alternative simple single-row header design
export function SimpleTableHeader({ type, view }: ImprovedTableHeaderProps) {
  const baseClasses = "text-center font-medium py-3 px-2 border-r border-slate-200"
  
  if (type === 'livestock') {
    return (
      <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200">
        <TableHead className={`${baseClasses} bg-slate-50 text-slate-700 font-bold`}>
          {view === 'weekly' ? '📅 Ngày' : '📅 Tháng'}
        </TableHead>
        <TableHead className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
          🥩 Thịt nạc
        </TableHead>
        <TableHead className={`${baseClasses} bg-pink-50 text-pink-700`}>
          🦴 Xương
        </TableHead>
        <TableHead className={`${baseClasses} bg-orange-50 text-orange-700`}>
          🫗 Thịt xay
        </TableHead>
        <TableHead className={`${baseClasses} bg-red-50 text-red-700`}>
          🫘 Lòng
        </TableHead>
        <TableHead className={`${baseClasses} bg-blue-50 text-blue-700 font-semibold`}>
          💰 Doanh thu
        </TableHead>
        <TableHead className={`${baseClasses} bg-gray-50 text-gray-700`}>
          🐷 Chi phí
        </TableHead>
        <TableHead className={`${baseClasses} bg-green-50 text-green-700 font-bold border-r-0`}>
          ✨ Lợi nhuận
        </TableHead>
      </TableRow>
    )
  }

  if (type === 'poultry') {
    return (
      <TableRow className="bg-gradient-to-r from-purple-100 to-purple-200">
        <TableHead className={`${baseClasses} bg-slate-50 text-slate-700 font-bold`}>
          {view === 'weekly' ? '📅 Ngày' : '📅 Tháng'}
        </TableHead>
        <TableHead className={`${baseClasses} bg-blue-50 text-blue-700`}>
          🐔 Thịt gia cầm (kg)
        </TableHead>
        <TableHead className={`${baseClasses} bg-blue-50 text-blue-700`}>
          💵 Giá trị (1.000đ)
        </TableHead>
        <TableHead className={`${baseClasses} bg-red-50 text-red-700`}>
          🐣 Gia cầm sống (kg)
        </TableHead>
        <TableHead className={`${baseClasses} bg-red-50 text-red-700`}>
          💸 Chi phí (1.000đ)
        </TableHead>
        <TableHead className={`${baseClasses} bg-green-50 text-green-700 font-bold border-r-0`}>
          ✨ Lãi/Lỗ (1.000đ)
        </TableHead>
      </TableRow>
    )
  }

  // Add other types as needed...
  return null
} 