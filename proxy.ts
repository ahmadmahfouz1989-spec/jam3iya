import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const role = (req.auth?.user as any)?.role
  const { pathname } = req.nextUrl
  const isLoginPage = pathname === "/login"
  const isApiAuth = pathname.startsWith("/api/auth")

  if (isApiAuth) return NextResponse.next()
  if (pathname.startsWith("/api/dev/") && process.env.NODE_ENV !== "production") return NextResponse.next()
  if (!isLoggedIn && !isLoginPage) return NextResponse.redirect(new URL("/login", req.url))
  if (isLoggedIn && isLoginPage) return NextResponse.redirect(new URL("/", req.url))

  // Members can only access the home page (API routes are allowed for dashboard data)
  if (isLoggedIn && role === "member" && pathname !== "/" && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
