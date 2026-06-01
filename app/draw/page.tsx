"use client"
import { useEffect, useState, useCallback } from "react"
import { currency } from "@/lib/format"
import confetti from "canvas-confetti"
import { AlertModal } from "@/components/Modal"

function playCelebrationSound() {
  const ctx = new AudioContext()
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = "sine"
    const t = ctx.currentTime + i * 0.15
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

function launchConfetti() {
  const end = Date.now() + 3000
  const colors = ["#ec4899", "#a855f7", "#f472b6", "#c084fc", "#fbbf24"]
  ;(function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors })
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

type Member = { id: string; name: string; isActive: boolean }
type Draw = { winner: Member; totalPot: number }
type Cycle = {
  id: string; cycleNumber: number; date: string; status: string; createdAt: string
  payments: { memberId: string }[]; draw: Draw | null
}
type Round = { id: string; contributionAmount: number; cycles: Cycle[] }

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06)",
}

export default function DrawPage() {
  const [data, setData] = useState<{ round: Round; members: Member[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState<{ winner: Member; totalPot: number } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [spinName, setSpinName] = useState("")
  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ name: string; pot: number } | null>(null)
  const [mode, setMode] = useState<"auto" | "manual" | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/cycles")
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCycle = data?.round.cycles.find(c => c.status === "OPEN")
  const winnerIdsThisRound = new Set(
    data?.round.cycles.filter(c => c.draw).map(c => c.draw!.winner.id) ?? []
  )
  const eligible = (data?.members ?? []).filter(m => m.isActive && !winnerIdsThisRound.has(m.id))

  function celebrate(draw: { winner: Member; totalPot: number }) {
    setResult(draw)
    setFlash({ name: draw.winner.name, pot: draw.totalPot })
    playCelebrationSound()
    launchConfetti()
  }

  async function runDraw() {
    if (!openCycle) return
    setDrawing(true)
    setResult(null)
    setSpinning(true)

    const spinInterval = setInterval(() => {
      const r = eligible[Math.floor(Math.random() * eligible.length)]
      setSpinName(r?.name ?? "")
    }, 80)

    await new Promise(r => setTimeout(r, 2500))
    clearInterval(spinInterval)
    setSpinning(false)

    const res = await fetch(`/api/cycles/${openCycle.id}/draw`, { method: "POST" })
    if (res.ok) {
      celebrate(await res.json())
      await load()
    } else {
      setAlertMsg((await res.json()).error ?? "Something went wrong")
      setMode(null)
    }
    setDrawing(false)
  }

  async function pickWinner(memberId: string) {
    if (!openCycle) return
    setDrawing(true)
    setResult(null)

    const res = await fetch(`/api/cycles/${openCycle.id}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId: memberId }),
    })
    if (res.ok) {
      celebrate(await res.json())
      await load()
    } else {
      setAlertMsg((await res.json()).error ?? "Something went wrong")
      setMode(null)
    }
    setDrawing(false)
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-pink-400 font-semibold pt-8">
      <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
      Loading...
    </div>
  )
  if (!data) return <p className="text-gray-400 pt-8">No active round.</p>

  return (
    <div className="space-y-5">
      {alertMsg && (
        <AlertModal
          icon="😬"
          title="Draw failed"
          message={alertMsg}
          onClose={() => setAlertMsg(null)}
        />
      )}

      {flash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setFlash(null)}
        >
          <div className="text-center px-8 select-none"
            style={{ animation: "winner-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div className="text-8xl mb-6">🎉</div>
            <p className="text-white/70 text-sm font-bold uppercase tracking-[0.3em] mb-3">Winner</p>
            <p className="font-black text-white mb-4"
              style={{ fontSize: "clamp(2.5rem, 10vw, 5rem)", lineHeight: 1.1, textShadow: "0 0 60px rgba(236,72,153,0.8)" }}>
              {flash.name}
            </p>
            <p className="font-black text-pink-300"
              style={{ fontSize: "clamp(1.5rem, 6vw, 2.5rem)" }}>
              {currency(flash.pot)}
            </p>
            <p className="text-white/40 text-xs font-semibold mt-8">tap to close</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-black text-gray-900">Draw ✨</h1>

      {!openCycle ? (
        <div className="rounded-3xl p-12 text-center" style={card}>
          <div className="text-6xl mb-4 select-none">🗓</div>
          <p className="font-bold text-gray-700">No open round right now</p>
          <p className="text-sm text-gray-400 mt-1">Opens automatically on its scheduled Wednesday</p>
        </div>
      ) : openCycle.draw ? (
        <div className="rounded-3xl p-8 text-center text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #ec4899, #a855f7, #7c3aed)", boxShadow: "0 8px 32px rgba(168,85,247,0.35)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative">
            <div className="text-5xl mb-3 select-none">🎊</div>
            <p className="text-pink-200 text-sm font-bold uppercase tracking-widest">Winner — Round {openCycle.cycleNumber}</p>
            <p className="text-4xl font-black mt-2">{openCycle.draw.winner.name}</p>
            <p className="text-2xl font-bold text-pink-200 mt-2">{currency(openCycle.draw.totalPot)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={card}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(251,207,232,0.3)" }}>
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">Round {openCycle.cycleNumber}</p>
            <p className="font-bold text-gray-800 mt-0.5">
              {new Date(openCycle.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500 font-medium">
                {openCycle.payments.length}/{data.members.length} paid
              </span>
              <span className="text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Pot: {currency(data.round.contributionAmount * data.members.length)}
              </span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Eligible */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Eligible — {eligible.length} members
              </p>
              <div className="flex flex-wrap gap-2">
                {eligible.map(m => (
                  <span key={m.id} className="px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{ background: "rgba(253,242,248,0.8)", color: "#db2777", border: "1.5px solid rgba(251,207,232,0.6)" }}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Spin animation */}
            {spinning && (
              <div className="rounded-2xl py-8 text-center"
                style={{ background: "linear-gradient(135deg, rgba(253,242,248,0.8), rgba(237,233,254,0.8))", border: "1.5px solid rgba(251,207,232,0.5)" }}>
                <p className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-3">Drawing...</p>
                <p className="text-3xl font-black animate-pulse"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {spinName}
                </p>
                <div className="flex justify-center gap-1.5 mt-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Winner reveal */}
            {result && !spinning && (
              <div className="rounded-2xl py-8 text-center text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 20px rgba(236,72,153,0.3)" }}>
                <div className="text-4xl mb-2 select-none">🎉</div>
                <p className="text-pink-200 text-xs font-bold uppercase tracking-widest">Winner!</p>
                <p className="text-3xl font-black mt-1">{result.winner.name}</p>
                <p className="text-xl font-bold text-pink-200 mt-1">{currency(result.totalPot)}</p>
              </div>
            )}

            {/* Action area */}
            {!result && !spinning && (() => {
              const paidMemberIds = new Set(openCycle.payments.map(p => p.memberId))
              const unpaid = data.members.filter(m => !paidMemberIds.has(m.id))

              if (unpaid.length > 0) {
                return (
                  <div className="rounded-2xl px-5 py-4 text-center"
                    style={{ background: "rgba(255,228,230,0.5)", border: "1.5px solid rgba(254,202,202,0.8)" }}>
                    <p className="font-bold text-rose-500 text-sm">Waiting on payments</p>
                    <p className="text-rose-400 text-sm mt-1">
                      {unpaid.map(m => m.name).join(", ")}
                    </p>
                  </div>
                )
              }

              if (mode === null) {
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setMode("auto"); runDraw() }}
                      disabled={drawing}
                      className="py-4 rounded-2xl text-white font-black text-sm tracking-wide transition-all disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 24px rgba(236,72,153,0.35)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none" }}>
                      🎰 Random Draw
                    </button>
                    <button
                      onClick={() => setMode("manual")}
                      disabled={drawing}
                      className="py-4 rounded-2xl font-black text-sm tracking-wide transition-all disabled:opacity-60"
                      style={{ background: "rgba(253,242,248,0.8)", color: "#db2777", border: "1.5px solid rgba(251,207,232,0.6)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none" }}>
                      👆 Pick Winner
                    </button>
                  </div>
                )
              }

              if (mode === "manual") {
                return (
                  <div className="space-y-3">
                    <button
                      onClick={() => setMode(null)}
                      className="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors">
                      ← Back
                    </button>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tap to select winner</p>
                    <div className="grid grid-cols-2 gap-2">
                      {eligible.map(m => (
                        <button
                          key={m.id}
                          onClick={() => pickWinner(m.id)}
                          disabled={drawing}
                          className="py-3 px-4 rounded-2xl text-sm font-bold text-left transition-all disabled:opacity-60"
                          style={{ background: "rgba(253,242,248,0.8)", color: "#db2777", border: "1.5px solid rgba(251,207,232,0.6)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(253,242,248,0.8)"; e.currentTarget.style.transform = "none" }}>
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              return null
            })()}
          </div>
        </div>
      )}

      {/* Round summary */}
      <div className="rounded-3xl p-5" style={card}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">All rounds</p>
        <ul className="space-y-2">
          {data.round.cycles.map(cycle => (
            <li key={cycle.id} className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold text-gray-500">
                Round {cycle.cycleNumber}
                <span className="text-gray-300 font-medium ml-2">
                  {new Date(cycle.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </span>
              {cycle.draw
                ? <span className="text-sm font-bold text-pink-500">{cycle.draw.winner.name} · {currency(cycle.draw.totalPot)}</span>
                : <span className="text-xs font-semibold text-gray-200">pending</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
