"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { SupplyManagementContent } from "../supply-management-content"

// Inner component to use useSession() within SessionProvider
function SupplyManagementWithSession() {
  const { data: session } = useSession()
  return <SupplyManagementContent session={session} />
}

// Wrapper component that provides SessionProvider
export function SupplyManagementWrapper() {
  return (
    <SessionProvider>
      <SupplyManagementWithSession />
    </SessionProvider>
  )
}