"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { MoreHorizontal, UserCheck, UserX, Edit } from "lucide-react"
import { usersApi } from "@/lib/api-client"
import { User } from "@/types"

export function UsersTable() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState("")

  // Debug current user info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const user = localStorage.getItem("user")
      console.log("Current user debug info:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        user: user ? JSON.parse(user) : null,
        userRole: user ? JSON.parse(user).role : null
      })
    }
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getUsers()
        console.log("Users API response:", response)
        
        // Handle different response formats
        const data = Array.isArray(response) ? response : (response as any).data || []
        console.log("Processed users data:", data)
        
        setUsers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách người dùng",
        })
        setUsers([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  const handleApprove = (user: User) => {
    setSelectedUser(user)
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedUser) return

    try {
      await usersApi.updateUser(selectedUser.id, { status: "active" })

      toast({
        title: "Phê duyệt thành công",
        description: `Đã phê duyệt tài khoản của ${selectedUser.fullName}`,
      })
      // Cập nhật danh sách người dùng
      setUsers(Array.isArray(users) ? users.map((user) => (user.id === selectedUser.id ? { ...user, status: "active" } : user)) : [])
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        variant: "destructive",
        title: "Phê duyệt thất bại",
        description: "Đã xảy ra lỗi khi phê duyệt tài khoản",
      })
    } finally {
      setApproveDialogOpen(false)
    }
  }

  const handleReject = (user: User) => {
    setSelectedUser(user)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedUser) return

    try {
      await usersApi.updateUser(selectedUser.id, { status: "rejected" })

      toast({
        title: "Từ chối thành công",
        description: `Đã từ chối tài khoản của ${selectedUser.fullName}`,
      })
      // Cập nhật danh sách người dùng
      setUsers(Array.isArray(users) ? users.map((user) => (user.id === selectedUser.id ? { ...user, status: "rejected" } : user)) : [])
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast({
        variant: "destructive",
        title: "Từ chối thất bại",
        description: "Đã xảy ra lỗi khi từ chối tài khoản",
      })
    } finally {
      setRejectDialogOpen(false)
    }
  }

  const handleChangeRole = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setRoleDialogOpen(true)
  }

  const handleChangeRoleConfirm = async () => {
    if (!selectedUser) return

    try {
      await usersApi.updateUser(selectedUser.id, { role: selectedRole })

      toast({
        title: "Thay đổi vai trò thành công",
        description: `Đã thay đổi vai trò của ${selectedUser.fullName} thành ${getRoleName(selectedRole)}`,
      })
      // Cập nhật danh sách người dùng
      setUsers(Array.isArray(users) ? users.map((user) => (user.id === selectedUser.id ? { ...user, role: selectedRole } : user)) : [])
    } catch (error) {
      console.error("Error changing role:", error)
      toast({
        variant: "destructive",
        title: "Thay đổi vai trò thất bại",
        description: "Đã xảy ra lỗi khi thay đổi vai trò",
      })
    } finally {
      setRoleDialogOpen(false)
    }
  }

  // Hàm chuyển đổi mã vai trò thành tên hiển thị
  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "brigadeAssistant":
        return "Trợ lý Lữ đoàn"
      case "unitAssistant":
        return "Trợ lý hậu cần Tiểu đoàn"
      case "stationManager":
        return "Trạm trưởng"
      case "commander":
        return "Chỉ huy"
      default:
        return role
    }
  }

  // Hàm chuyển đổi mã trạng thái thành tên hiển thị
  const getStatusName = (status: string) => {
    switch (status) {
      case "active":
        return "Đã phê duyệt"
      case "pending":
        return "Chờ phê duyệt"
      case "rejected":
        return "Đã từ chối"
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Tên đăng nhập</TableHead>
            <TableHead>Cấp bậc</TableHead>
            <TableHead>Chức vụ</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(users) && users.length > 0 ? users.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell>{user.rank}</TableCell>
              <TableCell>{user.position}</TableCell>
              <TableCell>{user.unit?.name || "N/A"}</TableCell>
              <TableCell>{getRoleName(user.role)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.status === "active" ? "success" : user.status === "rejected" ? "destructive" : "outline"
                  }
                >
                  {getStatusName(user.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Mở menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.status === "pending" && (
                      <>
                        <DropdownMenuItem onClick={() => handleApprove(user)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Phê duyệt
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReject(user)}>
                          <UserX className="mr-2 h-4 w-4" />
                          Từ chối
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.status === "active" && (
                      <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Thay đổi vai trò
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                {Array.isArray(users) ? "Không có người dùng nào" : "Đang tải dữ liệu..."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Phê duyệt tài khoản</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt tài khoản của {selectedUser?.fullName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleApproveConfirm}>Phê duyệt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Từ chối tài khoản</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn từ chối tài khoản của {selectedUser?.fullName}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thay đổi vai trò</DialogTitle>
            <DialogDescription>Thay đổi vai trò cho tài khoản của {selectedUser?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="brigadeAssistant">Trợ lý Lữ đoàn</SelectItem>
                  <SelectItem value="unitAssistant">Trợ lý hậu cần Tiểu đoàn</SelectItem>
                  <SelectItem value="stationManager">Trạm trưởng</SelectItem>
                  <SelectItem value="commander">Chỉ huy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleChangeRoleConfirm}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
