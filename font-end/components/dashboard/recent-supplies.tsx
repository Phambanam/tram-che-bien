import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const recentSupplies = [
  {
    id: 1,
    unit: "Tiểu đoàn 1",
    category: "Rau",
    product: "Rau muống",
    quantity: 50,
    harvestDate: "2025-05-15",
    status: "Đã phê duyệt",
  },
  {
    id: 2,
    unit: "Tiểu đoàn 2",
    category: "Gia cầm",
    product: "Gà",
    quantity: 30,
    harvestDate: "2025-05-16",
    status: "Chờ phê duyệt",
  },
  {
    id: 3,
    unit: "Tiểu đoàn 3",
    category: "Gia súc",
    product: "Lợn",
    quantity: 100,
    harvestDate: "2025-05-17",
    status: "Đã phê duyệt",
  },
  {
    id: 4,
    unit: "Tiểu đoàn 1",
    category: "Hải sản",
    product: "Cá chép",
    quantity: 40,
    harvestDate: "2025-05-18",
    status: "Chờ phê duyệt",
  },
  {
    id: 5,
    unit: "Tiểu đoàn 2",
    category: "Rau",
    product: "Rau cải",
    quantity: 45,
    harvestDate: "2025-05-19",
    status: "Đã phê duyệt",
  },
]

export function RecentSupplies() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>STT</TableHead>
          <TableHead>Đơn vị</TableHead>
          <TableHead>Phân loại</TableHead>
          <TableHead>Sản phẩm</TableHead>
          <TableHead>Số lượng (kg)</TableHead>
          <TableHead>Ngày thu hoạch</TableHead>
          <TableHead>Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentSupplies.map((supply) => (
          <TableRow key={supply.id}>
            <TableCell>{supply.id}</TableCell>
            <TableCell>{supply.unit}</TableCell>
            <TableCell>{supply.category}</TableCell>
            <TableCell>{supply.product}</TableCell>
            <TableCell>{supply.quantity}</TableCell>
            <TableCell>{supply.harvestDate}</TableCell>
            <TableCell>
              <Badge variant={supply.status === "Đã phê duyệt" ? "success" : "outline"}>{supply.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
