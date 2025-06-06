import type React from "react"
import { MainNav } from "@/components/main-nav"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { DebugToken } from "@/components/debug-token"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
      <SiteHeader />
      <MainNav />
      <main className="flex-1 bg-[#d6e4ee] w-full">{children}</main>
      <SiteFooter />
      {/* <DebugToken /> */}
    </div>
  )
}
