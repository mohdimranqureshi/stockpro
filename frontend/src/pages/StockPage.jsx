
import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Scan, Keyboard } from 'lucide-react'
import { stockApi } from '../lib/api'
import {
  Modal,
  Badge,
  Spinner,
  EmptyState,
  Pagination,
  ConfirmDialog,
} from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const STATUSES = [
  'AVAILABLE',
  'SOLD',
  'IN_REPAIR',
  'SCRAPPED',
  'REPLACED',
]

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const EMPTY = {
  itemName: '',
  sku: '',
  serialNumber: '',
  challanNumber: '',
  rate: '',
  category: '',
  brand: '',
  status: 'AVAILABLE',
  barcode: '',
  unit: 'PCS',
  quantity: 1,
  hsnCode: '',
  purchaseDate: '',
  supplier: '',
  location: '',
  notes: '',
}

// ── Barcode / Serial Number Input ─────────────────────────────
function BarcodeSerialInput({
  value,
  onChange,
  placeholder = 'e.g. SN-2026-001',
}) {
  const [mode, setMode] = useState('manual')
  const [scanFlash, setScanFlash] = useState(false)
  const inputRef = useRef(null)
  const lastKeyTime = useRef(0)

  useEffect(() => {
    if (mode === 'scan') {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [mode])

  const handleKeyDown = (e) => {
    if (mode !== 'scan') return

    const now = Date.now()
    lastKeyTime.current = now

    if (e.key === 'Enter') {
      e.preventDefault()

      if (value.trim()) {
        setScanFlash(true)
        setTimeout(() => setScanFlash(false), 1200)

        toast.success(`Serial number scanned: ${value}`, {
          icon: '📷',
          duration: 2000,
        })
      }

      return
    }

    if (e.key === 'Escape') {
      setMode('manual')
    }
  }

  const scanBorderClass =
    mode === 'scan'
      ? scanFlash
        ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50'
        : 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 animate-pulse'
      : ''

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap gap-2">
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

      <div className="relative min-w-0">
        <input
          ref={inputRef}
          className={`input w-full min-w-0 font-mono pr-10 transition-all ${scanBorderClass}`}
          placeholder={
            mode === 'scan'
              ? '📷 Point scanner at barcode and scan...'
              : placeholder
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {mode === 'scan' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {scanFlash ? (
              <span className="text-emerald-500 text-sm font-bold">
                ✓
              </span>
            ) : (
              <Scan className="w-4 h-4 text-blue-500 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {mode === 'scan' && (
        <p className="text-xs text-blue-600 font-medium">
          🔵 Scanner ready — point at barcode and press trigger.
          Press{' '}
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
            Esc
          </kbd>{' '}
          to switch to manual.
        </p>
      )}

      {mode === 'manual' && value && (
        <p className="text-xs text-gray-400">
          ✏️ Typing manually — or click "Scan Barcode" to use a scanner
        </p>
      )}
    </div>
  )
}

// ── Main StockPage ────────────────────────────────────────────
export default function StockPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({
    status: '',
    name: '',
    userId: '',
  })
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)

    const params = { page, size: 15, ...filters }

    if (!params.status) delete params.status
    if (!params.name) delete params.name
    if (!params.userId) delete params.userId

    stockApi
      .list(params)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setForm({ ...EMPTY })
    setEditId(null)
    setModal('form')
  }

  const openEdit = (item) => {
    setForm({
      ...EMPTY,
      ...item,
      rate: String(item.rate ?? ''),
      purchaseDate: item.purchaseDate || '',
      quantity: item.quantity ?? 1,
      serialNumber: item.serialNumber || '',
      challanNumber: item.challanNumber || '',
    })

    setEditId(item.id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.itemName.trim() || !form.sku.trim() || !form.rate) {
      return toast.error(
        'Item name, Serial Number & rate are required'
      )
    }

    const rate = Number(form.rate)
    const quantity = Number(form.quantity)

    if (!Number.isFinite(rate) || rate < 0) {
      return toast.error('Please enter a valid rate')
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return toast.error('Quantity must be a positive whole number')
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        rate,
        quantity,
      }

      if (editId) {
        await stockApi.update(editId, payload)
        toast.success('Item updated')
      } else {
        await stockApi.create(payload)
        toast.success('Item added to inventory')
      }

      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await stockApi.delete(id)
      toast.success('Item deleted')
      setConfirm(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed')
    }
  }

  const f = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Filters + Add button */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap min-w-0">
          <div className="relative w-full sm:w-52 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              className="input pl-9 w-full min-w-0"
              placeholder="Search name or serial no..."
              value={filters.name}
              onChange={(e) => {
                setPage(0)
                setFilters((previous) => ({
                  ...previous,
                  name: e.target.value,
                }))
              }}
            />
          </div>

          <select
            className="input w-full sm:w-40 min-w-0"
            value={filters.status}
            onChange={(e) => {
              setPage(0)
              setFilters((previous) => ({
                ...previous,
                status: e.target.value,
              }))
            }}
          >
            <option value="">All Status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <UserFilter
            value={filters.userId}
            onChange={(value) => {
              setPage(0)
              setFilters((previous) => ({
                ...previous,
                userId: value,
              }))
            }}
          />
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Inventory table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  'Item Name',
                  'Serial Number',
                  'Challan No',
                  'Rate',
                  'Category',
                  'Brand',
                  'Status',
                  'Qty',
                  'Supplier',
                  'Added',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="table-th whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11}>
                    <Spinner />
                  </td>
                </tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState message="No inventory items found" />
                  </td>
                </tr>
              ) : (
                data?.content?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">
                      {item.itemName}
                    </td>

                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <Scan className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="font-mono text-xs text-gray-600">
                          {item.sku || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="table-td font-mono text-xs text-blue-600">
                      {item.challanNumber || '—'}
                    </td>

                    <td className="table-td font-bold">
                      {fmt(item.rate)}
                    </td>

                    <td className="table-td text-gray-500">
                      {item.category || '—'}
                    </td>

                    <td className="table-td text-gray-500">
                      {item.brand || '—'}
                    </td>

                    <td className="table-td">
                      <Badge label={item.status} />
                    </td>

                    <td className="table-td text-gray-500">
                      {item.quantity} {item.unit}
                    </td>

                    <td className="table-td text-gray-500">
                      {item.supplier || '—'}
                    </td>

                    <td className="table-td text-gray-400 text-xs">
                      {item.createdAt?.slice(0, 10)}
                    </td>

                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label="Edit inventory item"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirm(item.id)}
                          aria-label="Delete inventory item"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={data?.totalPages || 0}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal === 'form' && (
        <Modal
          title={editId ? 'Edit Inventory Item' : 'Add Inventory Item'}
          onClose={() => {
            if (!saving) setModal(null)
          }}
          size="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            {/* Item name */}
            <div className="col-span-1 sm:col-span-2 min-w-0">
              <label className="label">
                Item / Product Name *
              </label>

              <input
                className="input w-full min-w-0"
                placeholder="e.g. Samsung 55 inch QLED TV"
                value={form.itemName}
                onChange={(e) => f('itemName', e.target.value)}
              />
            </div>

            {/* Item Identification */}
            <div className="col-span-1 sm:col-span-2 min-w-0 bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 space-y-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Item Identification
              </p>

              <div className="min-w-0">
                <label className="label">
                  Serial Number *
                  <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                    — type manually or scan with barcode scanner
                  </span>
                </label>

                <BarcodeSerialInput
                  value={form.sku}
                  onChange={(value) => f('sku', value)}
                  placeholder="e.g. SN-2026-001"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="min-w-0">
                  <label className="label">Challan Number</label>
                  <input
                    className="input w-full min-w-0"
                    placeholder="e.g. CHN-2026-045"
                    value={form.challanNumber}
                    onChange={(e) => f('challanNumber', e.target.value)}
                  />
                </div>

                <div className="min-w-0">
                  <label className="label">Barcode</label>
                  <input
                    className="input w-full min-w-0 font-mono"
                    placeholder="e.g. 8901234567890"
                    value={form.barcode}
                    onChange={(e) => f('barcode', e.target.value)}
                  />
                </div>

                <div className="min-w-0">
                  <label className="label">HSN Code</label>
                  <input
                    className="input w-full min-w-0"
                    placeholder="e.g. 8528"
                    value={form.hsnCode}
                    onChange={(e) => f('hsnCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Rate */}
            <div className="min-w-0">
              <label className="label">Rate (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input w-full min-w-0"
                value={form.rate}
                onChange={(e) => f('rate', e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="min-w-0">
              <label className="label">Category</label>
              <input
                className="input w-full min-w-0"
                placeholder="e.g. Electronics, Appliances"
                value={form.category}
                onChange={(e) => f('category', e.target.value)}
              />
            </div>

            {/* Brand */}
            <div className="min-w-0">
              <label className="label">Brand</label>
              <input
                className="input w-full min-w-0"
                placeholder="e.g. Samsung, LG"
                value={form.brand}
                onChange={(e) => f('brand', e.target.value)}
              />
            </div>

            {/* Supplier */}
            <div className="min-w-0">
              <label className="label">Supplier</label>
              <input
                className="input w-full min-w-0"
                placeholder="Supplier name"
                value={form.supplier}
                onChange={(e) => f('supplier', e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="min-w-0">
              <label className="label">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                className="input w-full min-w-0"
                value={form.quantity}
                onChange={(e) => f('quantity', e.target.value)}
              />
            </div>

            {/* Unit */}
            <div className="min-w-0">
              <label className="label">Unit</label>
              <select
                className="input w-full min-w-0"
                value={form.unit}
                onChange={(e) => f('unit', e.target.value)}
              >
                {[
                  'PCS',
                  'KG',
                  'LTR',
                  'MTR',
                  'BOX',
                  'SET',
                  'PAIR',
                  'DOZEN',
                ].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="min-w-0">
              <label className="label">Location / Shelf</label>
              <input
                className="input w-full min-w-0"
                placeholder="e.g. Rack A, Shelf 2"
                value={form.location}
                onChange={(e) => f('location', e.target.value)}
              />
            </div>

            {/* Purchase Date */}
            <div className="min-w-0">
              <label className="label">Purchase Date</label>
              <input
                type="date"
                className="input w-full min-w-0"
                value={form.purchaseDate}
                onChange={(e) => f('purchaseDate', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="min-w-0">
              <label className="label">Status</label>
              <select
                className="input w-full min-w-0"
                value={form.status}
                onChange={(e) => f('status', e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="col-span-1 sm:col-span-2 min-w-0">
              <label className="label">Notes</label>
              <textarea
                className="input w-full min-w-0 h-16 resize-y"
                value={form.notes}
                onChange={(e) => f('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
            <button
              type="button"
              onClick={() => setModal(null)}
              disabled={saving}
              className="btn-secondary w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full sm:w-auto"
            >
              {saving
                ? 'Saving...'
                : editId
                  ? 'Update Item'
                  : 'Add to Inventory'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
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
