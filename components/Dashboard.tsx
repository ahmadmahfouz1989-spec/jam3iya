"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { currency } from "@/lib/format"

type Member = { id: string; name: string; isActive: boolean; createdAt: string }
type Payment = { memberId: string; amount: number }
type Draw = { winner: Member; totalPot: number }
type Cycle = {
  id: string; cycleNumber: number; date: string; status: string; createdAt: string
  payments: Payment[]; draw: Draw | null
}
type Round = {
  id: string; contributionAmount: number; startDate: string; status: string; cycles: Cycle[]
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #f472b6, #c084fc)" }}>
      {initials}
    </div>
  )
}

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06), 0 1px 4px rgba(168,85,247,0.04)",
}

export default function Dashboard() {
  const [data, setData] = useState<{ round: Round; members: Member[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/cycles")
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePayment(cycleId: string, memberId: string, paid: boolean) {
    setBusy(`${cycleId}-${memberId}`)
    if (paid) {
      await fetch(`/api/cycles/${cycleId}/payment/${memberId}`, { method: "DELETE" })
    } else {
      await fetch(`/api/cycles/${cycleId}/payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })
    }
    await load()
    setBusy(null)
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-pink-400 font-semibold pt-8">
      <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
      Loading...
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <div className="text-7xl mb-6 select-none">🌸</div>
      <p className="text-gray-500 font-semibold mb-2">No active cycle yet</p>
      <p className="text-gray-400 text-sm mb-6">Set up your group to get started</p>
      <Link href="/settings"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 20px rgba(236,72,153,0.3)" }}>
        Start a cycle ✨
      </Link>
    </div>
  )

  const { round, members } = data
  const currentCycle = round.cycles.find(c => c.status === "OPEN") || round.cycles.find(c => c.status === "UPCOMING")
  const paidIds = new Set(currentCycle?.payments.map(p => p.memberId) ?? [])
  const paidCount = members.filter(m => paidIds.has(m.id)).length
  const totalMembers = members.length
  const pot = round.contributionAmount * paidCount
  const allPaid = paidCount === totalMembers

  function daysUntil(dateStr: string) {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - t.getTime()) / 86400000)
  }

  return (
    <div className="space-y-5">
      {/* Hero pot card */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 60%, #7c3aed 100%)", boxShadow: "0 8px 32px rgba(168,85,247,0.35)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "white", transform: "translate(20%, -30%)" }} />
        <p className="text-pink-200 text-xs font-bold uppercase tracking-widest">Current pot</p>
        <p className="text-5xl font-black mt-1 tracking-tight">{currency(pot)}</p>
        <p className="text-pink-200 text-sm mt-1 font-medium">{currency(round.contributionAmount)} × {totalMembers} members</p>

        {currentCycle && (
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold">Round {currentCycle.cycleNumber}</p>
              <p className="text-white font-bold text-sm">
                {new Date(currentCycle.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {currentCycle.status === "OPEN"
                ? <p className="text-yellow-300 text-xs font-bold mt-0.5">🎉 Draw day!</p>
                : <p className="text-pink-200 text-xs font-medium mt-0.5">in {daysUntil(currentCycle.date)} days</p>}
            </div>
            {currentCycle.status === "OPEN" && allPaid && (
              <Link href="/draw"
                className="px-4 py-2 rounded-2xl text-sm font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                Run Draw ✨
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Payments */}
      {currentCycle && (
        <div className="rounded-3xl p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Payments</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Round {currentCycle.cycleNumber} &bull;{" "}
                {new Date(currentCycle.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "rgba(251,207,232,0.5)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalMembers ? (paidCount / totalMembers) * 100 : 0}%`, background: "linear-gradient(90deg, #ec4899, #a855f7)" }} />
              </div>
              <span className="text-sm font-bold" style={{ color: allPaid ? "#10b981" : "#ec4899" }}>
                {paidCount}/{totalMembers}
              </span>
            </div>
          </div>

          <ul className="space-y-2">
            {members.map(member => {
              const paid = paidIds.has(member.id)
              const isBusy = busy === `${currentCycle.id}-${member.id}`
              return (
                <li key={member.id}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                  style={{ background: paid ? "rgba(209,250,229,0.4)" : "rgba(253,242,248,0.5)", border: `1px solid ${paid ? "rgba(167,243,208,0.6)" : "rgba(251,207,232,0.3)"}` }}>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} />
                    <span className="text-sm font-bold text-gray-800">{member.name}</span>
                  </div>
                  <button
                    onClick={() => togglePayment(currentCycle.id, member.id, paid)}
                    disabled={!!busy || currentCycle.status === "COMPLETED"}
                    className="text-xs font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-40"
                    style={{
                      background: paid ? "rgba(167,243,208,0.5)" : "rgba(255,255,255,0.8)",
                      color: paid ? "#059669" : "#9ca3af",
                      border: `1.5px solid ${paid ? "rgba(110,231,183,0.6)" : "rgba(251,207,232,0.6)"}`,
                    }}
                  >
                    {isBusy ? "..." : paid ? "Paid ✓" : "Mark paid"}
                  </button>
                </li>
              )
            })}
          </ul>

          {currentCycle.status === "OPEN" && !allPaid && (
            <p className="text-center text-xs text-gray-400 font-semibold mt-3">
              Waiting for {totalMembers - paidCount} more payment{totalMembers - paidCount !== 1 ? "s" : ""} before draw
            </p>
          )}
        </div>
      )}

      {/* Cycle grid */}
      <div className="grid grid-cols-3 gap-3">
        {round.cycles.map(cycle => {
          const isOpen = cycle.status === "OPEN"
          const isDone = cycle.status === "COMPLETED"
          return (
            <div key={cycle.id} className="rounded-2xl p-4 transition-all"
              style={{
                background: isDone ? "rgba(209,250,229,0.4)" : isOpen ? "rgba(253,242,248,0.8)" : "rgba(255,255,255,0.5)",
                border: isDone ? "1px solid rgba(167,243,208,0.6)" : isOpen ? "1.5px solid rgba(236,72,153,0.3)" : "1px solid rgba(251,207,232,0.3)",
                boxShadow: isOpen ? "0 4px 16px rgba(236,72,153,0.12)" : "none",
              }}>
              <p className="font-black text-gray-700 text-sm">#{cycle.cycleNumber}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {new Date(cycle.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              {cycle.draw
                ? <p className="text-xs font-bold text-emerald-600 mt-1.5">🏆 {cycle.draw.winner.name}</p>
                : <p className={`text-xs font-semibold mt-1.5 ${isOpen ? "text-pink-500" : "text-gray-300"}`}>
                    {isOpen ? "✨ Open" : "upcoming"}
                  </p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
