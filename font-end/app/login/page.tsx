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
          <Image src="/logo.svg" alt="Logo" width={40} height={40} className="mr-2" />
          Quân Nhu Lữ Đoàn
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Hệ thống quản lý nguồn nhập quân nhu giúp tối ưu hóa quy trình cung cấp và phê duyệt nguồn nhập, nâng cao
              hiệu quả công tác hậu cần."
            </p>
            <footer className="text-sm">Ban Chỉ Huy Lữ Đoàn</footer>
          </blockquote>
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
