"use client"
import { useEffect, useState, useCallback } from "react"
import { currency } from "@/lib/format"
import { ConfirmModal } from "@/components/Modal"

type Round = { id: string; contributionAmount: number; startDate: string; status: string }

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06)",
}

const inputStyle = {
  background: "rgba(253,242,248,0.7)",
  border: "1.5px solid rgba(251,207,232,0.7)",
}

export default function SettingsPage() {
  const [activeRound, setActiveRound] = useState<Round | null>(null)
  const [form, setForm] = useState({ contributionAmount: "", startDate: "", memberCount: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/rounds")
    const rounds: Round[] = await res.json()
    const active = rounds.find(r => r.status === "ACTIVE") ?? null
    setActiveRound(active)
    if (active) {
      setForm({ contributionAmount: String(active.contributionAmount), startDate: active.startDate.slice(0, 10), memberCount: "" })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeRound) {
      setShowConfirm(true)
    } else {
      await doCreate()
    }
  }

  async function doCreate() {
    setShowConfirm(false)
    setSaving(true)
    setSuccess(false)
    await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contributionAmount: Number(form.contributionAmount),
        startDate: form.startDate,
        memberCount: Number(form.memberCount),
      }),
    })
    await load()
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function doReset() {
    setShowReset(false)
    setResetting(true)
    await fetch("/api/dev/reset", { method: "POST" })
    await load()
    setResetting(false)
  }

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#ec4899"
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.1)"
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(251,207,232,0.7)"
    e.currentTarget.style.boxShadow = "none"
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-pink-400 font-semibold pt-8">
      <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
      Loading...
    </div>
  )

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          title="Start new cycle?"
          message="This will end the current cycle and all its remaining rounds. This can't be undone."
          confirmLabel="Yes, start new"
          onConfirm={doCreate}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showReset && (
        <ConfirmModal
          icon="🗑️"
          title="Delete everything?"
          message="All members, rounds, cycles, payments, and draws will be permanently deleted."
          confirmLabel="Yes, delete all"
          danger
          onConfirm={doReset}
          onCancel={() => setShowReset(false)}
        />
      )}

      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>

        {/* Active cycle info */}
        {activeRound && (
          <div className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 60%, #7c3aed 100%)", boxShadow: "0 8px 32px rgba(168,85,247,0.25)" }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-2xl pointer-events-none"
              style={{ background: "white", transform: "translate(20%, -30%)" }} />
            <div className="relative">
              <p className="text-pink-200 text-xs font-bold uppercase tracking-widest">Active cycle</p>
              <p className="text-white font-bold text-lg mt-1">
                {currency(activeRound.contributionAmount)} <span className="text-pink-200 font-medium text-sm">per person</span>
              </p>
              <p className="text-pink-200 text-sm font-medium mt-0.5">
                Started {new Date(activeRound.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* New cycle form */}
        <div className="rounded-3xl p-5" style={card}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {activeRound ? "Start new cycle" : "Start cycle"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount per person</label>
                <input
                  type="number" min="1" step="any"
                  value={form.contributionAmount}
                  onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))}
                  placeholder="e.g. 500"
                  className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Number of members</label>
                <input
                  type="number" min="2"
                  value={form.memberCount}
                  onChange={e => setForm(f => ({ ...f, memberCount: e.target.value }))}
                  placeholder="e.g. 8"
                  className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                  required
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              Rounds are scheduled every 14 days from the start date automatically
            </p>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 16px rgba(236,72,153,0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(236,72,153,0.45)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(236,72,153,0.3)"; e.currentTarget.style.transform = "none" }}>
                {saving ? "Saving..." : activeRound ? "Start new cycle" : "Start cycle"}
              </button>
              {success && <span className="text-sm font-bold text-emerald-500">Cycle started!</span>}
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-3xl p-5" style={{ ...card, border: "1px solid rgba(254,202,202,0.5)" }}>
          <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-3">Danger zone</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Delete all members, rounds, and history</p>
            <button
              onClick={() => setShowReset(true)}
              disabled={resetting}
              className="px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", boxShadow: "0 4px 12px rgba(244,63,94,0.25)" }}>
              {resetting ? "Deleting..." : "Reset everything"}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
