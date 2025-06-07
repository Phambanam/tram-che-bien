import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Get token from cookie instead of NextAuth
  const token = request.cookies.get("auth-token")?.value
  const isAuthenticated = !!token
  
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // API paths
  const isApiPath = request.nextUrl.pathname.startsWith("/api")

  // If the path is public or API, don't redirect
  if (isPublicPath || isApiPath) {
    return NextResponse.next()
  }

  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // For role-based access control, we would need to decode the token
  // But for now, we'll just allow authenticated users to access the dashboard

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|public).*)',
  ],
}
