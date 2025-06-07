"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"

const formSchema = z.object({
  phoneNumber: z.string()
    .min(1, { message: "Số điện thoại không được để trống" })
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, { 
      message: "Số điện thoại không hợp lệ (VD: 0987654321)" 
    }),
  password: z.string().min(1, {
    message: "Mật khẩu không được để trống",
  }),
})

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMsg("")
    console.log('Form values:', values)

    try {
      console.log('Attempting login with:', { phoneNumber: values.phoneNumber, password: values.password })
      await login(values.phoneNumber, values.password)
      
      console.log('Login successful, redirecting to dashboard')
      
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      })
      
      setTimeout(() => {
        console.log('Executing delayed redirect to dashboard')
        window.location.href = '/dashboard'
      }, 500)
    } catch (error: any) {
      console.error("Login error:", error)
      setErrorMsg(error.message || "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.")
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: error.message || "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.",
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
          name="phoneNumber"
          render={({ field }: { field: any }) => (
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Nhập mật khẩu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMsg && <div className="text-sm font-medium text-destructive">{errorMsg}</div>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng nhập
            </>
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </form>
    </Form>
  )
}
