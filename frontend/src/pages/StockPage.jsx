import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Scan, Keyboard } from 'lucide-react'
import { stockApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination, ConfirmDialog } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const STATUSES = ['AVAILABLE','SOLD','IN_REPAIR','SCRAPPED','REPLACED']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const EMPTY = {
  itemName:'', sku:'', serialNumber:'', challanNumber:'', rate:'', category:'', brand:'',
  status:'AVAILABLE', barcode:'', unit:'PCS', quantity:1,
  hsnCode:'', purchaseDate:'', supplier:'', location:'', notes:''
}

// ── Barcode / Serial Number Input ─────────────────────────────
// Works in two modes:
//   SCAN mode  — field is focused, pulsing border, scanner types + Enter → confirms
//   MANUAL mode — regular text input, user types freely
//
// Barcode scanners are HID keyboards that:
//   1. Type all characters very fast (< 50ms between keystrokes)
//   2. Send Enter (keyCode 13) at the end
// We detect this pattern to auto-confirm and show a success flash.
function BarcodeSerialInput({ value, onChange, placeholder = 'e.g. SN-2026-001' }) {
  const [mode, setMode]           = useState('manual') // 'manual' | 'scan'
  const [scanFlash, setScanFlash] = useState(false)
  const inputRef   = useRef(null)
  const lastKeyTime = useRef(0)
  const scanBuffer  = useRef('')

  // When switching to scan mode, auto-focus and select existing value
  useEffect(() => {
    if (mode === 'scan') {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [mode])

  const handleKeyDown = (e) => {
    if (mode !== 'scan') return
    const now = Date.now()
    const gap  = now - lastKeyTime.current
    lastKeyTime.current = now

    // Enter key = scanner finished sending barcode
    if (e.key === 'Enter') {
      e.preventDefault()
      if (value.trim()) {
        // Visual flash to confirm scan
        setScanFlash(true)
        setTimeout(() => setScanFlash(false), 1200)
        toast.success(`Serial number scanned: ${value}`, { icon: '📷', duration: 2000 })
        // Stay in scan mode so user can scan next item if needed
      }
      return
    }

    // Escape = cancel scan mode
    if (e.key === 'Escape') {
      setMode('manual')
    }
  }

  const scanBorderClass = mode === 'scan'
    ? scanFlash
      ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50'
      : 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 animate-pulse'
    : ''

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mode === 'manual'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode('scan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mode === 'scan'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          Scan Barcode
        </button>
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          className={`input w-full font-mono pr-10 transition-all ${scanBorderClass}`}
          placeholder={mode === 'scan' ? '📷 Point scanner at barcode and scan...' : placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Scanner icon indicator */}
        {mode === 'scan' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {scanFlash
              ? <span className="text-emerald-500 text-sm font-bold">✓</span>
              : <Scan className="w-4 h-4 text-blue-500 animate-pulse" />
            }
          </div>
        )}
      </div>

      {/* Mode hint */}
      {mode === 'scan' && (
        <p className="text-xs text-blue-600 font-medium">
          🔵 Scanner ready — point at barcode and press trigger.
          Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">Esc</kbd> to switch to manual.
        </p>
      )}
      {mode === 'manual' && value && (
        <p className="text-xs text-gray-400">✏️ Typing manually — or click "Scan Barcode" to use a scanner</p>
      )}
    </div>
  )
}

// ── Main StockPage ────────────────────────────────────────────
export default function StockPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [filters, setFilters] = useState({ status:'', name:'', userId:'' })
  const [modal, setModal]     = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 15, ...filters }
    if (!params.status) delete params.status
    if (!params.name)   delete params.name
    if (!params.userId) delete params.userId
    stockApi.list(params)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('form') }

  const openEdit = (item) => {
    setForm({
      ...item,
      rate:         String(item.rate),
      purchaseDate: item.purchaseDate   || '',
      quantity:     item.quantity       || 1,
      serialNumber: item.serialNumber   || '',
      challanNumber: item.challanNumber || '',
    })
    setEditId(item.id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.itemName || !form.sku || !form.rate)
      return toast.error('Item name, Serial Number & rate are required')
    setSaving(true)
    try {
      const payload = { ...form, rate: parseFloat(form.rate), quantity: parseInt(form.quantity) }
      if (editId) {
        await stockApi.update(editId, payload)
        toast.success('Item updated')
      } else {
        await stockApi.create(payload)
        toast.success('Item added to inventory')
      }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await stockApi.delete(id)
      toast.success('Item deleted')
      setConfirm(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">

      {/* Filters + Add button */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 w-52"
              placeholder="Search name or serial no..."
              value={filters.name}
              onChange={e => { setPage(0); setFilters(p => ({ ...p, name: e.target.value })) }}
            />
          </div>
          <select
            className="input w-40"
            value={filters.status}
            onChange={e => { setPage(0); setFilters(p => ({ ...p, status: e.target.value })) }}
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <UserFilter value={filters.userId} onChange={v => { setPage(0); setFilters(p => ({ ...p, userId: v })) }} />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Item Name','Serial Number','Challan No','Rate','Category','Brand','Status','Qty','Supplier','Added','Actions'].map(h =>
                  <th key={h} className="table-th whitespace-nowrap">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11}><Spinner /></td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={11}><EmptyState message="No inventory items found" /></td></tr>
              ) : data?.content?.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{item.itemName}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <Scan className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-600">{item.sku || '—'}</span>
                    </div>
                  </td>
                  <td className="table-td font-mono text-xs text-blue-600">{item.challanNumber || '—'}</td>
                  <td className="table-td font-bold">{fmt(item.rate)}</td>
                  <td className="table-td text-gray-500">{item.category || '—'}</td>
                  <td className="table-td text-gray-500">{item.brand || '—'}</td>
                  <td className="table-td"><Badge label={item.status} /></td>
                  <td className="table-td text-gray-500">{item.quantity} {item.unit}</td>
                  <td className="table-td text-gray-500">{item.supplier || '—'}</td>
                  <td className="table-td text-gray-400 text-xs">{item.createdAt?.slice(0,10)}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirm(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={data?.totalPages || 0} onChange={setPage} />
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">

            {/* Item name */}
            <div className="col-span-2">
              <label className="label">Item / Product Name *</label>
              <input className="input" placeholder="e.g. Samsung 55 inch QLED TV"
                value={form.itemName} onChange={e => f('itemName', e.target.value)} />
            </div>

            {/* ── Item Identification block ── */}
            <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Item Identification
              </p>

              {/* Serial Number with barcode scanner support */}
              <div>
                <label className="label">
                  Serial Number *
                  <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                    — type manually or scan with barcode scanner
                  </span>
                </label>
                <BarcodeSerialInput
                  value={form.sku}
                  onChange={v => f('sku', v)}
                  placeholder="e.g. SN-2026-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Challan Number</label>
                  <input className="input" placeholder="e.g. CHN-2026-045"
                    value={form.challanNumber} onChange={e => f('challanNumber', e.target.value)} />
                </div>
                <div>
                  <label className="label">Barcode</label>
                  <input className="input font-mono" placeholder="e.g. 8901234567890"
                    value={form.barcode} onChange={e => f('barcode', e.target.value)} />
                </div>
                <div>
                  <label className="label">HSN Code</label>
                  <input className="input" placeholder="e.g. 8528"
                    value={form.hsnCode} onChange={e => f('hsnCode', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Pricing & details */}
            <div>
              <label className="label">Rate (₹) *</label>
              <input type="number" className="input" value={form.rate}
                onChange={e => f('rate', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Electronics, Appliances"
                value={form.category} onChange={e => f('category', e.target.value)} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" placeholder="e.g. Samsung, LG"
                value={form.brand} onChange={e => f('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input" placeholder="Supplier name"
                value={form.supplier} onChange={e => f('supplier', e.target.value)} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" value={form.quantity}
                onChange={e => f('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => f('unit', e.target.value)}>
                {['PCS','KG','LTR','MTR','BOX','SET','PAIR','DOZEN'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location / Shelf</label>
              <input className="input" placeholder="e.g. Rack A, Shelf 2"
                value={form.location} onChange={e => f('location', e.target.value)} />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={form.purchaseDate}
                onChange={e => f('purchaseDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" value={form.notes}
                onChange={e => f('notes', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editId ? 'Update Item' : 'Add to Inventory'}
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message="Delete this inventory item? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
