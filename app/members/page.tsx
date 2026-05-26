"use client"
import { useEffect, useState, useCallback } from "react"
import { ConfirmModal } from "@/components/Modal"

type Member = {
  id: string; name: string; phone: string | null; isActive: boolean
  draws: { id: string }[]; payments: { id: string }[]
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-black text-white flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #f472b6, #c084fc)", fontSize: size > 8 ? "1rem" : "0.7rem" }}
    >
      {initials}
    </div>
  )
}

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(251,207,232,0.5)",
  boxShadow: "0 4px 24px rgba(236,72,153,0.06)",
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [form, setForm] = useState({ name: "", phone: "" })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "" })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/members")
    setMembers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setForm({ name: "", phone: "" })
    load()
  }

  async function saveEdit(id: string) {
    await fetch(`/api/members/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    setEditId(null)
    load()
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/members/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/members/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="space-y-5">
      {deleteTarget && (
        <ConfirmModal
          icon="🗑️"
          title={`Delete ${deleteTarget.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <h1 className="text-2xl font-black text-gray-900">Members</h1>

      {/* Add form */}
      <div className="rounded-3xl p-5" style={card}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Add member</p>
        <form onSubmit={addMember} className="flex gap-3 flex-wrap">
          <input
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="flex-1 min-w-36 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all"
            style={{ background: "rgba(253,242,248,0.7)", border: "1.5px solid rgba(251,207,232,0.7)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#ec4899"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.1)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(251,207,232,0.7)"; e.currentTarget.style.boxShadow = "none" }}
            required
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="flex-1 min-w-36 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all"
            style={{ background: "rgba(253,242,248,0.7)", border: "1.5px solid rgba(251,207,232,0.7)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#ec4899"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.1)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(251,207,232,0.7)"; e.currentTarget.style.boxShadow = "none" }}
          />
          <button type="submit"
            className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", boxShadow: "0 4px 16px rgba(236,72,153,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(236,72,153,0.45)"; e.currentTarget.style.transform = "translateY(-1px)" }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(236,72,153,0.3)"; e.currentTarget.style.transform = "none" }}>
            Add
          </button>
        </form>
      </div>

      {/* Members list */}
      <div className="rounded-3xl overflow-hidden" style={card}>
        {loading ? (
          <div className="p-8 text-center text-pink-300 font-semibold">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3 select-none">👯‍♀️</div>
            <p className="text-gray-400 font-semibold">No members yet</p>
            <p className="text-gray-300 text-sm mt-1">Add your girls above</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "rgba(251,207,232,0.3)" }}>
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-pink-50/30">
                <Avatar name={m.name} size={10} />
                <div className="flex-1 min-w-0">
                  {editId === m.id ? (
                    <div className="flex gap-2">
                      <input value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold outline-none"
                        style={{ background: "rgba(253,242,248,0.9)", border: "1.5px solid #ec4899" }} />
                      <input value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone"
                        className="w-32 rounded-xl px-3 py-1.5 text-sm outline-none"
                        style={{ background: "rgba(253,242,248,0.9)", border: "1.5px solid rgba(251,207,232,0.8)" }} />
                    </div>
                  ) : (
                    <>
                      <p className={`font-bold text-sm ${m.isActive ? "text-gray-800" : "line-through text-gray-300"}`}>{m.name}</p>
                      {m.phone && <p className="text-xs text-gray-400 font-medium mt-0.5">{m.phone}</p>}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.draws.length > 0 && (
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      🏆 {m.draws.length}
                    </span>
                  )}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={m.isActive
                      ? { background: "rgba(209,250,229,0.5)", color: "#059669", border: "1px solid rgba(167,243,208,0.6)" }
                      : { background: "rgba(243,244,246,0.5)", color: "#9ca3af", border: "1px solid rgba(229,231,235,0.8)" }}>
                    {m.isActive ? "Active" : "Inactive"}
                  </span>

                  {editId === m.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(m.id)}
                        className="text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors">Save</button>
                      <button onClick={() => setEditId(null)}
                        className="text-xs font-semibold text-gray-300 hover:text-gray-500 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(m.id); setEditForm({ name: m.name, phone: m.phone ?? "" }) }}
                        className="text-xs font-semibold text-gray-300 hover:text-pink-400 transition-colors">Edit</button>
                      <button onClick={() => toggleActive(m.id, m.isActive)}
                        className="text-xs font-semibold text-gray-300 hover:text-purple-400 transition-colors">
                        {m.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                        className="text-xs font-semibold text-gray-300 hover:text-rose-400 transition-colors">Delete</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
