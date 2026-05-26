import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isLoginPage = pathname === "/login"
  const isApiAuth = pathname.startsWith("/api/auth")

  if (isApiAuth) return NextResponse.next()
  if (pathname === "/api/health") return NextResponse.next()
  if (pathname.startsWith("/api/dev/") && process.env.NODE_ENV !== "production") return NextResponse.next()
  if (!isLoggedIn && !isLoginPage) return NextResponse.redirect(new URL("/login", req.url))
  if (isLoggedIn && isLoginPage) return NextResponse.redirect(new URL("/", req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
