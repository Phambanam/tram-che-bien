import type React from "react"
import { MainNav } from "@/components/main-nav"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <MainNav />
      <main className="flex-1 bg-[#d6e4ee] p-6">{children}</main>
      <SiteFooter />
    </div>
  )
}
