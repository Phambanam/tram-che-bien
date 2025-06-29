"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { authApi, unitsApi } from "@/lib/api-client"

const formSchema = z
  .object({
    fullName: z.string().min(1, {
      message: "Họ và tên không được để trống",
    }),
    phoneNumber: z.string()
      .min(1, { message: "Số điện thoại không được để trống" })
      .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, { 
        message: "Số điện thoại không hợp lệ (VD: 0987654321)" 
      }),
    password: z.string().min(6, {
      message: "Mật khẩu phải có ít nhất 6 ký tự",
    }),
    confirmPassword: z.string().min(1, {
      message: "Xác nhận mật khẩu không được để trống",
    }),
    rank: z.string().min(1, {
      message: "Cấp bậc không được để trống",
    }),
    position: z.string().min(1, {
      message: "Chức vụ không được để trống",
    }),
    unit: z.string().min(1, {
      message: "Đơn vị không được để trống",
    }),
    role: z.string().min(1, {
      message: "Vai trò không được để trống",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

interface Unit {
  _id: string
  name: string
}

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      rank: "",
      position: "",
      unit: "",
      role: "unitAssistant", // Mặc định là trợ lý tiểu đoàn
    },
  })

  useEffect(() => {
    // Fetch units
    const fetchUnits = async () => {
      try {
        const response = await unitsApi.getUnits()
        // API trả về {success: true, count: number, data: array}
        if (response && response.data && Array.isArray(response.data)) {
          setUnits(response.data)
        } else if (Array.isArray(response)) {
          // Fallback nếu API trả về trực tiếp array
          setUnits(response)
        } else {
          console.error("Units data is not an array:", response)
          setUnits([])
        }
      } catch (error) {
        console.error("Error fetching units:", error)
        setUnits([])
      }
    }

    fetchUnits()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      console.log('🚀 Register form submitting:', values)
      const response = await authApi.register(values)
      
      console.log('📋 Register form response:', response)

      if (response.success) {
        toast({
          title: "Đăng ký thành công",
          description: response.message || "Tài khoản của bạn đang chờ phê duyệt",
        })
        router.push("/login")
      } else {
        toast({
          variant: "destructive",
          title: "Đăng ký thất bại",
          description: response.message || "Đã xảy ra lỗi khi đăng ký",
        })
      }
    } catch (error) {
      console.error('❌ Register form error:', error)
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập họ và tên" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nhập số điện thoại (VD: 0987654321)" 
                  type="tel"
                  maxLength={10}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Xác nhận mật khẩu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cấp bậc</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập cấp bậc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chức vụ</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập chức vụ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đơn vị</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units && Array.isArray(units) && units.map((unit) => (
                    <SelectItem key={unit._id} value={unit._id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vai trò</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unitAssistant">Trợ lý hậu cần Tiểu đoàn</SelectItem>
                  <SelectItem value="brigadeAssistant">Trợ lý hậu cần Lữ đoàn</SelectItem>
                  <SelectItem value="stationManager">Trạm trưởng</SelectItem>
                  <SelectItem value="commander">Chỉ huy</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng ký
            </>
          ) : (
            "Đăng ký"
          )}
        </Button>
      </form>
    </Form>
  )
}
