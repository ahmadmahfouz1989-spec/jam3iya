import React from "react"

const overlay: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(6px)",
}

const box: React.CSSProperties = {
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(251,207,232,0.6)",
  boxShadow: "0 20px 60px rgba(236,72,153,0.15)",
}

const cancelBtn: React.CSSProperties = {
  background: "rgba(243,244,246,0.8)",
  color: "#6b7280",
  border: "1px solid rgba(229,231,235,0.8)",
}

const pinkBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, #ec4899, #a855f7)",
  boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
}

const redBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
  boxShadow: "0 4px 16px rgba(244,63,94,0.3)",
}

type ConfirmProps = {
  icon?: string
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  icon = "⚠️",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={overlay}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={box}>
        <div className="text-center">
          <div className="text-4xl mb-3 select-none">{icon}</div>
          <p className="font-black text-gray-800 text-lg">{title}</p>
          {message && <p className="text-sm text-gray-500 mt-2 font-medium">{message}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
            style={cancelBtn}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
            style={danger ? redBtn : pinkBtn}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

type AlertProps = {
  icon?: string
  title: string
  message?: string
  onClose: () => void
}

export function AlertModal({ icon = "😬", title, message, onClose }: AlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={overlay}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={box}>
        <div className="text-center">
          <div className="text-4xl mb-3 select-none">{icon}</div>
          <p className="font-black text-gray-800 text-lg">{title}</p>
          {message && <p className="text-sm text-gray-500 mt-2 font-medium">{message}</p>}
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all"
          style={pinkBtn}>
          OK
        </button>
      </div>
    </div>
  )
}
