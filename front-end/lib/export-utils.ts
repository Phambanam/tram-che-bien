import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface MenuExportData {
  week: number
  year: number
  startDate: string
  endDate: string
  dailyMenus: Array<{
    date: string
    dayName: string
    mealCount: number
    status: string
    meals: Array<{
      type: string
      dishes: string[]
    }>
  }>
}

export interface IngredientExportData {
  date: string
  dayName: string
  mealCount: number
  ingredients: Array<{
    stt: number
    name: string
    quantity: number
    unit: string
    category: string
    usedInDishes: string
  }>
}

// Export menu to Excel
export const exportMenuToExcel = (menuData: MenuExportData) => {
  const wb = XLSX.utils.book_new()
  
  // Create menu overview sheet
  const menuOverviewData = [
    ['BÁO CÁO THỰC ĐƠN TUẦN'],
    [`Tuần ${menuData.week}, ${menuData.year}`],
    [`Từ ngày ${format(new Date(menuData.startDate), 'dd/MM/yyyy')} đến ${format(new Date(menuData.endDate), 'dd/MM/yyyy')}`],
    [],
    ['Ngày', 'Thứ', 'Số người ăn', 'Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Trạng thái']
  ]
  
  menuData.dailyMenus.forEach(dailyMenu => {
    const morningDishes = dailyMenu.meals.find(m => m.type === 'morning')?.dishes.join(', ') || ''
    const noonDishes = dailyMenu.meals.find(m => m.type === 'noon')?.dishes.join(', ') || ''
    const eveningDishes = dailyMenu.meals.find(m => m.type === 'evening')?.dishes.join(', ') || ''
    
    menuOverviewData.push([
      format(new Date(dailyMenu.date), 'dd/MM/yyyy'),
      dailyMenu.dayName,
      dailyMenu.mealCount,
      morningDishes,
      noonDishes,
      eveningDishes,
      'Đã duyệt' // Always approved when created by brigade assistant
    ])
  })
  
  const ws1 = XLSX.utils.aoa_to_sheet(menuOverviewData)
  
  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Ngày
    { wch: 10 }, // Thứ
    { wch: 12 }, // Số người ăn
    { wch: 30 }, // Buổi sáng
    { wch: 30 }, // Buổi trưa
    { wch: 30 }, // Buổi chiều
    { wch: 12 }  // Trạng thái
  ]
  ws1['!cols'] = colWidths
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Thực đơn tuần')
  
  // Create detailed sheets for each day
  menuData.dailyMenus.forEach(dailyMenu => {
    const dayData = [
      [`THỰC ĐƠN NGÀY ${format(new Date(dailyMenu.date), 'dd/MM/yyyy')}`],
      [`${dailyMenu.dayName} - ${dailyMenu.mealCount} người ăn`],
      [],
      ['Buổi ăn', 'Món ăn']
    ]
    
    dailyMenu.meals.forEach(meal => {
      const mealName = meal.type === 'morning' ? 'Buổi sáng' :
                      meal.type === 'noon' ? 'Buổi trưa' : 'Buổi chiều'
      
      if (meal.dishes.length > 0) {
        meal.dishes.forEach((dish, index) => {
          dayData.push([index === 0 ? mealName : '', dish])
        })
      } else {
        dayData.push([mealName, 'Chưa có món ăn'])
      }
    })
    
    const ws = XLSX.utils.aoa_to_sheet(dayData)
    ws['!cols'] = [{ wch: 15 }, { wch: 40 }]
    
    const sheetName = `${dailyMenu.dayName} ${format(new Date(dailyMenu.date), 'dd-MM')}`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })
  
  // Save file
  const fileName = `Thuc_Don_Tuan_${menuData.week}_${menuData.year}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Export ingredients to Excel
export const exportIngredientsToExcel = (ingredientsData: IngredientExportData[], isAllDays: boolean) => {
  const wb = XLSX.utils.book_new()
  
  if (isAllDays) {
    // Create summary sheet for all days
    const summaryData = [
      ['TỔNG HỢP NGUYÊN LIỆU TUẦN'],
      [`Xuất ngày ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [],
      ['Ngày', 'Thứ', 'Số người ăn', 'Số loại nguyên liệu']
    ]
    
    ingredientsData.forEach(dayData => {
      summaryData.push([
        format(new Date(dayData.date), 'dd/MM/yyyy'),
        dayData.dayName,
        dayData.mealCount,
        dayData.ingredients.length
      ])
    })
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng hợp')
    
    // Create detailed sheet for each day
    ingredientsData.forEach(dayData => {
      const dayDetailData = [
        [`NGUYÊN LIỆU NGÀY ${format(new Date(dayData.date), 'dd/MM/yyyy')}`],
        [`${dayData.dayName} - ${dayData.mealCount} người ăn`],
        [],
        ['STT', 'Tên nguyên liệu', 'Số lượng', 'Đơn vị', 'Phân loại', 'Dùng trong món']
      ]
      
      dayData.ingredients.forEach(ingredient => {
        dayDetailData.push([
          ingredient.stt,
          ingredient.name,
          parseFloat(ingredient.quantity.toFixed(2)),
          ingredient.unit,
          ingredient.category,
          ingredient.usedInDishes
        ])
      })
      
      const ws = XLSX.utils.aoa_to_sheet(dayDetailData)
      ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 25 },  // Tên nguyên liệu
        { wch: 12 },  // Số lượng
        { wch: 8 },   // Đơn vị
        { wch: 15 },  // Phân loại
        { wch: 40 }   // Dùng trong món
      ]
      
      const sheetName = `${dayData.dayName} ${format(new Date(dayData.date), 'dd-MM')}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    const fileName = `Nguyen_Lieu_Tuan_${format(new Date(), 'yyyyMMdd')}.xlsx`
    XLSX.writeFile(wb, fileName)
  } else {
    // Single day export
    const dayData = ingredientsData[0]
    const singleDayData = [
      [`NGUYÊN LIỆU NGÀY ${format(new Date(dayData.date), 'dd/MM/yyyy')}`],
      [`${dayData.dayName} - ${dayData.mealCount} người ăn`],
      [`Xuất ngày ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [],
      ['STT', 'Tên nguyên liệu', 'Số lượng', 'Đơn vị', 'Phân loại', 'Dùng trong món']
    ]
    
    dayData.ingredients.forEach(ingredient => {
      singleDayData.push([
        ingredient.stt,
        ingredient.name,
        parseFloat(ingredient.quantity.toFixed(2)),
        ingredient.unit,
        ingredient.category,
        ingredient.usedInDishes
      ])
    })
    
    // Add summary at the end
    singleDayData.push([])
    singleDayData.push(['TỔNG KẾT'])
    singleDayData.push(['Tổng số loại nguyên liệu:', dayData.ingredients.length])
    singleDayData.push(['Số người ăn:', dayData.mealCount])
    
    const ws = XLSX.utils.aoa_to_sheet(singleDayData)
    ws['!cols'] = [
      { wch: 5 },   // STT
      { wch: 25 },  // Tên nguyên liệu
      { wch: 12 },  // Số lượng
      { wch: 8 },   // Đơn vị
      { wch: 15 },  // Phân loại
      { wch: 40 }   // Dùng trong món
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Nguyên liệu')
    
    const fileName = `Nguyen_Lieu_${format(new Date(dayData.date), 'yyyyMMdd')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }
}

// Print menu
export const printMenu = (menuData: MenuExportData) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Thực đơn tuần ${menuData.week}/${menuData.year}</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 14pt;
          margin: 5px 0;
        }
        .period {
          font-size: 12pt;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .day-col { width: 10%; }
        .count-col { width: 8%; }
        .meal-col { width: 22%; }
        .status-col { width: 10%; }
        .meal-list {
          list-style: disc;
          margin: 0;
          padding-left: 15px;
        }
        .meal-list li {
          margin: 2px 0;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Báo cáo thực đơn tuần</h1>
        <h2>Tuần ${menuData.week}, ${menuData.year}</h2>
        <div class="period">
          Từ ngày ${format(new Date(menuData.startDate), 'dd/MM/yyyy')} đến ${format(new Date(menuData.endDate), 'dd/MM/yyyy')}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="day-col">Ngày</th>
            <th class="count-col">Số người ăn</th>
            <th class="meal-col">Buổi sáng</th>
            <th class="meal-col">Buổi trưa</th>
            <th class="meal-col">Buổi chiều</th>
            <th class="status-col">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${menuData.dailyMenus.map(dailyMenu => {
            const morningDishes = dailyMenu.meals.find(m => m.type === 'morning')?.dishes || []
            const noonDishes = dailyMenu.meals.find(m => m.type === 'noon')?.dishes || []
            const eveningDishes = dailyMenu.meals.find(m => m.type === 'evening')?.dishes || []
            
            return `
              <tr>
                <td>
                  <strong>${dailyMenu.dayName}</strong><br>
                  ${format(new Date(dailyMenu.date), 'dd/MM/yyyy')}
                </td>
                <td style="text-align: center;">${dailyMenu.mealCount}</td>
                <td>
                  ${morningDishes.length > 0 ? 
                    `<ul class="meal-list">${morningDishes.map(dish => `<li>${dish}</li>`).join('')}</ul>` : 
                    '<em>Chưa có món ăn</em>'
                  }
                </td>
                <td>
                  ${noonDishes.length > 0 ? 
                    `<ul class="meal-list">${noonDishes.map(dish => `<li>${dish}</li>`).join('')}</ul>` : 
                    '<em>Chưa có món ăn</em>'
                  }
                </td>
                <td>
                  ${eveningDishes.length > 0 ? 
                    `<ul class="meal-list">${eveningDishes.map(dish => `<li>${dish}</li>`).join('')}</ul>` : 
                    '<em>Chưa có món ăn</em>'
                  }
                </td>
                <td style="text-align: center;">
                  Đã duyệt
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: right; font-style: italic;">
        In ngày ${format(new Date(), 'dd/MM/yyyy HH:mm')}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
}

// Print ingredients list
export const printIngredients = (ingredientsData: IngredientExportData[], isAllDays: boolean) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${isAllDays ? 'Danh sách nguyên liệu tuần' : `Nguyên liệu ngày ${format(new Date(ingredientsData[0]?.date), 'dd/MM/yyyy')}`}</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }
        .day-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .day-header {
          background-color: #f0f0f0;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #000;
          font-weight: bold;
          font-size: 13pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #e0e0e0;
          font-weight: bold;
          text-align: center;
        }
        .stt-col { width: 5%; }
        .name-col { width: 25%; }
        .qty-col { width: 10%; text-align: right; }
        .unit-col { width: 8%; }
        .category-col { width: 12%; }
        .dishes-col { width: 40%; }
        .dishes-tags {
          font-size: 9pt;
          color: #666;
        }
        .summary {
          margin-top: 20px;
          padding: 10px;
          background-color: #f9f9f9;
          border: 1px solid #ccc;
        }
        @media print {
          .no-print { display: none; }
          .day-section { page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${isAllDays ? 'Danh sách nguyên liệu tuần' : `Danh sách nguyên liệu ngày ${format(new Date(ingredientsData[0]?.date), 'dd/MM/yyyy')}`}</h1>
        ${!isAllDays && ingredientsData[0] ? `<div>${ingredientsData[0].dayName} - ${ingredientsData[0].mealCount} người ăn</div>` : ''}
      </div>
      
      ${ingredientsData.map(dayData => `
        <div class="day-section">
          ${isAllDays ? `
            <div class="day-header">
              ${dayData.dayName} - ${format(new Date(dayData.date), 'dd/MM/yyyy')} (${dayData.mealCount} người ăn)
            </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th class="stt-col">STT</th>
                <th class="name-col">Tên nguyên liệu</th>
                <th class="qty-col">Số lượng</th>
                <th class="unit-col">Đơn vị</th>
                <th class="category-col">Phân loại</th>
                <th class="dishes-col">Dùng trong món</th>
              </tr>
            </thead>
            <tbody>
              ${dayData.ingredients.map(ingredient => `
                <tr>
                  <td class="stt-col" style="text-align: center;">${ingredient.stt}</td>
                  <td class="name-col"><strong>${ingredient.name}</strong></td>
                  <td class="qty-col">${ingredient.quantity.toFixed(2)}</td>
                  <td class="unit-col">${ingredient.unit}</td>
                  <td class="category-col">${ingredient.category}</td>
                  <td class="dishes-col">
                    <div class="dishes-tags">${ingredient.usedInDishes}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${!isAllDays ? `
            <div class="summary">
              <strong>Tổng kết:</strong> ${dayData.ingredients.length} loại nguyên liệu cho ${dayData.mealCount} người ăn
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <div style="margin-top: 30px; text-align: right; font-style: italic;">
        In ngày ${format(new Date(), 'dd/MM/yyyy HH:mm')}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
} 