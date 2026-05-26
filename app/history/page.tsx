"use client"
import { useEffect, useState, useCallback } from "react"
import { currency } from "@/lib/format"

type Member = { id: string; name: string }
type Draw = { winner: Member; totalPot: number; drawnAt: string }
type Cycle = { id: string; cycleNumber: number; date: string; draw: Draw | null }
type Round = { id: string; contributionAmount: number; startDate: string; status: string; cycles: Cycle[] }

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06)",
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

export default function HistoryPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/rounds")
    setRounds(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center gap-2 text-pink-400 font-semibold pt-8">
      <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
      Loading...
    </div>
  )

  if (rounds.length === 0) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">History</h1>
      <div className="rounded-3xl p-12 text-center" style={card}>
        <div className="text-6xl mb-4 select-none">📖</div>
        <p className="font-bold text-gray-700">No history yet</p>
        <p className="text-sm text-gray-400 mt-1">Completed cycles will appear here</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-gray-900">History</h1>

      {rounds.map((round, idx) => {
        const wins = round.cycles.filter(c => c.draw)
        const isActive = round.status === "ACTIVE"
        const totalPaid = wins.reduce((sum, c) => sum + c.draw!.totalPot, 0)

        return (
          <div key={round.id} className="rounded-3xl overflow-hidden" style={card}>
            {/* Round header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(251,207,232,0.3)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Cycle {rounds.length - idx}
                  </p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    Started {new Date(round.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {currency(round.contributionAmount)} per person
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-3 py-1 rounded-full font-bold"
                    style={isActive
                      ? { background: "rgba(253,242,248,0.8)", color: "#db2777", border: "1.5px solid rgba(251,207,232,0.6)" }
                      : { background: "rgba(209,250,229,0.5)", color: "#059669", border: "1px solid rgba(167,243,208,0.6)" }}>
                    {isActive ? "Active ✨" : "Completed"}
                  </span>
                  {wins.length > 0 && (
                    <p className="text-xs font-bold mt-2"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {currency(totalPaid)} distributed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {wins.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 font-medium">No draws yet</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "rgba(251,207,232,0.2)" }}>
                {wins.map(cycle => (
                  <li key={cycle.id} className="flex items-center gap-3 px-5 py-3 hover:bg-pink-50/20 transition-colors">
                    <Avatar name={cycle.draw!.winner.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{cycle.draw!.winner.name}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        Round {cycle.cycleNumber} &bull;{" "}
                        {new Date(cycle.draw!.drawnAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <p className="text-sm font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {currency(cycle.draw!.totalPot)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
