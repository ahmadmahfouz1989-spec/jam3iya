"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

const adminLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/members", label: "Members", icon: "👯‍♀️" },
  { href: "/draw", label: "Draw", icon: "🎰" },
  { href: "/cycles", label: "Rounds", icon: "📋" },
  { href: "/history", label: "History", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
]

export default function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const links = adminLinks

  if (pathname === "/login") return null

  return (
    <>
      {/* Desktop top nav */}
      <nav
        className="hidden md:flex sticky top-0 z-50 px-6 py-3 items-center gap-4"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(251,207,232,0.5)",
          boxShadow: "0 1px 20px rgba(236,72,153,0.06)",
        }}
      >
        <span className="font-black text-lg tracking-tight flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          jam3iya 🌸
        </span>

        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-all"
                style={{ color: active ? "#db2777" : "#9ca3af", background: active ? "rgba(251,207,232,0.5)" : "transparent" }}>
                {label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {session?.user?.name && (
            <span className="text-xs font-semibold text-gray-400">{session.user.name}</span>
          )}
          <button onClick={() => signOut({ redirect: false }).then(() => window.location.replace("/login"))}
            className="text-xs font-semibold text-gray-400 hover:text-pink-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-pink-50">
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between px-5 py-3"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(251,207,232,0.5)",
          boxShadow: "0 1px 20px rgba(236,72,153,0.06)",
        }}>
        <span className="font-black text-base tracking-tight"
          style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          jam3iya 🌸
        </span>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs font-semibold text-gray-400 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(253,242,248,0.7)", border: "1px solid rgba(251,207,232,0.5)" }}>
          Sign out
        </button>
      </div>

      {/* Mobile bottom tab bar */}
      {(
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(251,207,232,0.5)",
            boxShadow: "0 -4px 20px rgba(236,72,153,0.06)",
            paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
          }}>
          {links.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-0"
                style={{ background: active ? "rgba(251,207,232,0.5)" : "transparent" }}>
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-bold leading-none"
                  style={{ color: active ? "#db2777" : "#9ca3af" }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
