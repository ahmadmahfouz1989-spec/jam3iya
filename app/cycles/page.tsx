"use client"
import { useEffect, useState, useCallback } from "react"
import { currency } from "@/lib/format"

type Member = { id: string; name: string }
type Payment = { memberId: string; member: Member; amount: number }
type Draw = { winner: Member; totalPot: number; drawnAt: string }
type Cycle = { id: string; cycleNumber: number; date: string; status: string; payments: Payment[]; draw: Draw | null }
type Round = { id: string; contributionAmount: number; cycles: Cycle[] }

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06)",
}

export default function CyclesPage() {
  const [data, setData] = useState<{ round: Round; members: Member[] } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/cycles")
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePayment(cycleId: string, memberId: string, paid: boolean) {
    const key = `${cycleId}-${memberId}`
    setToggling(key)
    if (paid) {
      await fetch(`/api/cycles/${cycleId}/payment/${memberId}`, { method: "DELETE" })
    } else {
      await fetch(`/api/cycles/${cycleId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })
    }
    await load()
    setToggling(null)
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-pink-400 font-semibold pt-8">
      <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
      Loading...
    </div>
  )
  if (!data) return <p className="text-gray-400 pt-8">No active cycle.</p>

  const { round, members } = data

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Rounds</h1>
        <span className="text-sm font-semibold text-gray-400">
          {currency(round.contributionAmount)} <span className="text-gray-300">/ person</span>
        </span>
      </div>

      {round.cycles.map(cycle => {
        const paidIds = new Set(cycle.payments.map(p => p.memberId))
        const isOpen = cycle.status === "OPEN"
        const isDone = cycle.status === "COMPLETED"
        const isExpanded = expanded === cycle.id

        return (
          <div key={cycle.id} className="rounded-3xl overflow-hidden transition-all"
            style={{
              ...card,
              border: isOpen ? "1.5px solid rgba(236,72,153,0.3)" : card.border,
              boxShadow: isOpen ? "0 4px 24px rgba(236,72,153,0.1)" : card.boxShadow,
            }}>
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-pink-50/20"
              onClick={() => setExpanded(isExpanded ? null : cycle.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                  style={{
                    background: isDone
                      ? "linear-gradient(135deg, #34d399, #10b981)"
                      : isOpen
                      ? "linear-gradient(135deg, #ec4899, #a855f7)"
                      : "rgba(243,244,246,1)",
                    color: isDone || isOpen ? "white" : "#d1d5db",
                  }}>
                  {cycle.cycleNumber}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    Round {cycle.cycleNumber} &middot; {new Date(cycle.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                  </p>
                  {cycle.draw && (
                    <p className="text-xs font-semibold text-emerald-500 mt-0.5">🏆 {cycle.draw.winner.name} won {currency(cycle.draw.totalPot)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: paidIds.size === members.length ? "#10b981" : "#9ca3af" }}>
                    {paidIds.size}/{members.length}
                  </p>
                  <p className="text-xs text-gray-300 font-medium">paid</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold"
                  style={isDone
                    ? { background: "rgba(209,250,229,0.5)", color: "#059669", border: "1px solid rgba(167,243,208,0.6)" }
                    : isOpen
                    ? { background: "rgba(253,242,248,0.8)", color: "#db2777", border: "1.5px solid rgba(251,207,232,0.6)" }
                    : { background: "rgba(243,244,246,0.5)", color: "#d1d5db", border: "1px solid rgba(229,231,235,0.5)" }}>
                  {isDone ? "Done" : isOpen ? "Open ✨" : "Soon"}
                </span>
                <span className="text-gray-300 text-xs">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(251,207,232,0.3)" }}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 mb-3">
                  Payments {isOpen && <span className="normal-case font-medium text-pink-300 ml-1">— tap to mark paid</span>}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => {
                    const paid = paidIds.has(m.id)
                    const key = `${cycle.id}-${m.id}`
                    const busy = toggling === key

                    return isOpen ? (
                      <button
                        key={m.id}
                        disabled={busy}
                        onClick={() => togglePayment(cycle.id, m.id, paid)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all disabled:opacity-60"
                        style={{
                          background: paid ? "rgba(209,250,229,0.5)" : "rgba(253,242,248,0.4)",
                          border: `1.5px solid ${paid ? "rgba(167,243,208,0.7)" : "rgba(251,207,232,0.4)"}`,
                        }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: paid ? "#10b981" : "#e9d5ff" }} />
                        <span className="text-sm font-semibold text-gray-700 truncate">{m.name}</span>
                        {paid && <span className="ml-auto text-xs font-bold text-emerald-500">{currency(round.contributionAmount)}</span>}
                      </button>
                    ) : (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{
                          background: paid ? "rgba(209,250,229,0.4)" : "rgba(253,242,248,0.4)",
                          border: `1px solid ${paid ? "rgba(167,243,208,0.5)" : "rgba(251,207,232,0.3)"}`,
                        }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: paid ? "#10b981" : "#e9d5ff" }} />
                        <span className="text-sm font-semibold text-gray-700 truncate">{m.name}</span>
                        {paid && <span className="ml-auto text-xs font-bold text-emerald-500">{currency(round.contributionAmount)}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
