"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Pagination } from "@/components/ui/pagination"
import { usersApi, User } from "@/lib/api-client"


export function UsersTable() {

  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await usersApi.getAll(currentPage, limit)
        if (response.success) {
          setUsers(response.data || [])
          setTotalCount(response.totalCount || 0)
          setTotalPages(response.totalPages || 1)
        } else {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tải danh sách người dùng",
          })
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Đã xảy ra lỗi khi tải danh sách người dùng",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast, currentPage, limit])

  const handleApprove = (user: User) => {
    setSelectedUser(user)
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "active" }),
      })

      if (response.ok) {
        toast({
          title: "Phê duyệt thành công",
          description: `Đã phê duyệt tài khoản của ${selectedUser.fullName}`,
        })
        // Cập nhật danh sách người dùng
        setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, status: "active" } : user)))
      } else {
        toast({
          variant: "destructive",
          title: "Phê duyệt thất bại",
          description: "Đã xảy ra lỗi khi phê duyệt tài khoản",
        })
      }
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
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (response.ok) {
        toast({
          title: "Từ chối thành công",
          description: `Đã từ chối tài khoản của ${selectedUser.fullName}`,
        })
        // Cập nhật danh sách người dùng
        setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, status: "rejected" } : user)))
      } else {
        toast({
          variant: "destructive",
          title: "Từ chối thất bại",
          description: "Đã xảy ra lỗi khi từ chối tài khoản",
        })
      }
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
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (response.ok) {
        toast({
          title: "Thay đổi vai trò thành công",
          description: `Đã thay đổi vai trò của ${selectedUser.fullName} thành ${getRoleName(selectedRole)}`,
        })
        // Cập nhật danh sách người dùng
        setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: selectedRole } : user)))
      } else {
        toast({
          variant: "destructive",
          title: "Thay đổi vai trò thất bại",
          description: "Đã xảy ra lỗi khi thay đổi vai trò",
        })
      }
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted">
              <TableHead className="w-[50px] font-medium">STT</TableHead>
              <TableHead className="font-medium">Họ và tên</TableHead>
              <TableHead className="font-medium">Tên đăng nhập</TableHead>
              <TableHead className="font-medium">Cấp bậc</TableHead>
              <TableHead className="font-medium">Chức vụ</TableHead>
              <TableHead className="font-medium">Đơn vị</TableHead>
              <TableHead className="font-medium">Vai trò</TableHead>
              <TableHead className="font-medium">Trạng thái</TableHead>
              <TableHead className="w-[80px] text-right font-medium">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Không có dữ liệu người dùng
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow 
                  key={user.id} 
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <TableCell className="font-medium">{(currentPage - 1) * limit + index + 1}</TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.rank}</TableCell>
                  <TableCell>{user.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      {user.unit?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      user.role === "admin" 
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" 
                        : user.role === "brigadeAssistant" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : user.role === "unitAssistant"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="font-medium"
                      variant={
                        user.status === "active" 
                          ? "default" 
                          : user.status === "rejected" 
                          ? "destructive" 
                          : "outline"
                      }
                    >
                      {getStatusName(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Mở menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.status === "pending" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleApprove(user)}
                              className="text-green-600 focus:text-green-600 dark:text-green-400"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Phê duyệt
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleReject(user)}
                              className="text-red-600 focus:text-red-600 dark:text-red-400"
                            >
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị {users.length} trên tổng số {totalCount} người dùng
        </div>
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Phê duyệt tài khoản</DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground">
              Bạn có chắc chắn muốn phê duyệt tài khoản của <span className="font-medium text-foreground">{selectedUser?.fullName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleApproveConfirm} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Từ chối tài khoản</DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground">
              Bạn có chắc chắn muốn từ chối tài khoản của <span className="font-medium text-foreground">{selectedUser?.fullName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
            >
              <UserX className="mr-2 h-4 w-4" />
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Thay đổi vai trò</DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground">
              Thay đổi vai trò cho tài khoản của <span className="font-medium text-foreground">{selectedUser?.fullName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <label htmlFor="role" className="text-sm font-medium">
                Vai trò người dùng
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                    Admin
                  </SelectItem>
                  <SelectItem value="brigadeAssistant" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Trợ lý Lữ đoàn
                  </SelectItem>
                  <SelectItem value="unitAssistant" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Trợ lý hậu cần Tiểu đoàn
                  </SelectItem>
                  <SelectItem value="commander" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
                    Chỉ huy
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleChangeRoleConfirm}>
              <Edit className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
