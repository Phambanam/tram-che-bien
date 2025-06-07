import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Đăng ký | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Đăng ký tài khoản mới vào hệ thống quản lý nguồn nhập quân nhu",
}

export default function RegisterPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-green-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
                      <Image 
              src="/images/logo.png" 
              alt="Logo Lữ đoàn 279" 
              width={40} 
              height={40} 
              className="mr-2"
              style={{ width: 40, height: 40 }} 
            />
          PHẦN MỀM QUẢN LÝ TRẠM CHẾ BIẾN
        </div>
        <div className="relative z-20 mt-auto">
          <h3 className="font-bold mb-2">LIÊN HỆ:</h3>
          <p className="mb-1"><strong>ĐỊA CHỈ:</strong> Lữ đoàn 279 - Phường Bình Hòa - Tp Thuận An - Tỉnh Bình Dương</p>
          <div className="mb-2">
            <p className="font-semibold">NHÓM TÁC GIẢ:</p>
            <p className="ml-4">• Đại tá Tạ Duy Đĩnh - Phó Lữ đoàn trưởng</p>
            <p className="ml-4">• Trung tá Vũ Đình Vinh - Chủ nhiệm HC-KT</p>
            <p className="ml-4">• Thiếu tá Đậu Trọng Lợi - Trợ lý Quân nhu</p>
            <p className="ml-4">• Đại úy Nguyễn Đức Thiện - Trợ lý Xe máy</p>
            <p className="ml-4">• Thượng úy Nguyễn Văn Thành - Phó Trạm trưởng TSC</p>
          </div>
          <p className="mb-1"><strong>SỐ ĐIỆN THOẠI:</strong> 0969752776</p>
          <p><strong>GMAIL:</strong> Nguyenthanhmta279259@gmail.com</p>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Đăng ký tài khoản</h1>
            <p className="text-sm text-muted-foreground">Nhập thông tin cá nhân để đăng ký tài khoản mới</p>
          </div>
          <RegisterForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
