import { NextRequest, NextResponse } from "next/server"

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
    return NextResponse.next()
  }

  // Optimistic check: presence of session cookie means logged in
  // NextAuth v5 uses "authjs.*" prefix; v4 used "next-auth.*"
  const isLoggedIn =
    !!req.cookies.get("authjs.session-token") ||
    !!req.cookies.get("__Secure-authjs.session-token") ||
    !!req.cookies.get("next-auth.session-token") ||
    !!req.cookies.get("__Secure-next-auth.session-token")
  const isLoginPage = pathname === "/login"

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
}
