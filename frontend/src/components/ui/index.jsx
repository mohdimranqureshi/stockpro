import { X } from 'lucide-react'

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, onClose, children, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
const BADGE_COLORS = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  SOLD: 'bg-gray-100 text-gray-600',
  IN_REPAIR: 'bg-yellow-100 text-yellow-700',
  SCRAPPED: 'bg-red-100 text-red-700',
  REPLACED: 'bg-purple-100 text-purple-700',
  SALE: 'bg-emerald-100 text-emerald-700',
  PURCHASE: 'bg-blue-100 text-blue-700',
  INFLOW: 'bg-emerald-100 text-emerald-700',
  OUTFLOW: 'bg-red-100 text-red-700',
  TAGGED_FOR_SALE: 'bg-orange-100 text-orange-700',
  PENDING_EVALUATION: 'bg-yellow-100 text-yellow-700',
  DISMANTLED: 'bg-gray-100 text-gray-600',
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-600',
}

export function Badge({ label }) {
  const color = BADGE_COLORS[label] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}>
      {label?.replace(/_/g, ' ')}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:  { bg: 'bg-blue-50',   icon: 'bg-blue-600',   text: 'text-blue-700' },
    green: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-700' },
    red:   { bg: 'bg-red-50',    icon: 'bg-red-600',    text: 'text-red-700' },
    orange:{ bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-700' },
    purple:{ bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-700' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`card p-5 ${c.bg} border-0`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <FormField label={label} error={error}>
      <input className="input" {...props} />
    </FormField>
  )
}

// ── Select ────────────────────────────────────────────────────
export function Select({ label, error, options = [], placeholder, ...props }) {
  return (
    <FormField label={label} error={error}>
      <select className="input" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </FormField>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ message = 'No records found' }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-lg">📭</p>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
      >← Prev</button>
      <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
      >Next →</button>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────
export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel} size="sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn-danger">Delete</button>
      </div>
    </Modal>
  )
}
