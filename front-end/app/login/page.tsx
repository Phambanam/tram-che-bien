import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { LoginForm } from "../../components/auth/login-form"

export const metadata: Metadata = {
  title: "Đăng nhập | Hệ thống Quản lý Nguồn Nhập Quân Nhu",
  description: "Đăng nhập vào hệ thống quản lý nguồn nhập quân nhu",
}

export default function LoginPage() {
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
          Quân Nhu Lữ Đoàn
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
            <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
            <p className="text-sm text-muted-foreground">Nhập thông tin đăng nhập của bạn để tiếp tục</p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
