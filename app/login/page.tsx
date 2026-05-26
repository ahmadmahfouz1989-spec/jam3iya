"use client"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const inputStyle = {
  background: "rgba(253,242,248,0.8)",
  border: "1.5px solid rgba(251,207,232,0.8)",
}

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  useEffect(() => setReady(true), [])

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#ec4899"
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.1)"
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(251,207,232,0.8)"
    e.currentTarget.style.boxShadow = "none"
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { password, redirect: false })
    if (!res?.error) {
      router.push("/")
    } else {
      setError("Wrong password")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 40%, #ede9fe 100%)" }}>
      <div className="fixed top-[-10%] right-[-5%] w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #f9a8d4, #c084fc)" }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #fbcfe8, #a78bfa)" }} />

      <div className="relative w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(251,207,232,0.6)",
          boxShadow: "0 20px 60px rgba(236,72,153,0.12), 0 4px 20px rgba(168,85,247,0.08)",
        }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 select-none">🌸</div>
          <h1 className="text-3xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            jam3iya
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Welcome back 💕</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-ready={ready || undefined}>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 placeholder-gray-300 transition-all outline-none"
              style={inputStyle}
              onFocus={focus} onBlur={blur}
              required autoFocus
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-center py-2 px-3 rounded-xl text-rose-500 text-sm font-semibold"
              style={{ background: "rgba(255,228,230,0.6)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold tracking-wide transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 20px rgba(236,72,153,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 28px rgba(236,72,153,0.45)"; e.currentTarget.style.transform = "translateY(-1px)" }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(236,72,153,0.35)"; e.currentTarget.style.transform = "none" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}
