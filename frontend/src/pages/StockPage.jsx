import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { stockApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination, ConfirmDialog } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const STATUSES = ['AVAILABLE','SOLD','IN_REPAIR','SCRAPPED','REPLACED']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const EMPTY = {
  itemName:'', sku:'', rate:'', category:'', brand:'',
  status:'AVAILABLE', barcode:'', unit:'PCS', quantity:1,
  hsnCode:'', purchaseDate:'', supplier:'', location:'', notes:''
}

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

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal('form') }
  const openEdit = (item) => {
    setForm({ ...item, rate: String(item.rate), purchaseDate: item.purchaseDate || '', quantity: item.quantity || 1 })
    setEditId(item.id); setModal('form')
  }

  const handleSave = async () => {
    if (!form.itemName || !form.sku || !form.rate) return toast.error('Item name, SKU & rate are required')
    setSaving(true)
    try {
      if (editId) {
        await stockApi.update(editId, { ...form, rate: parseFloat(form.rate), quantity: parseInt(form.quantity) })
        toast.success('Item updated')
      } else {
        await stockApi.create({ ...form, rate: parseFloat(form.rate), quantity: parseInt(form.quantity) })
        toast.success('Item added to inventory')
      }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await stockApi.delete(id)
      toast.success('Item deleted'); setConfirm(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9 w-48" placeholder="Search name or SKU..."
              value={filters.name}
              onChange={e => { setPage(0); setFilters(p => ({ ...p, name: e.target.value })) }} />
          </div>
          <select className="input w-40"
            value={filters.status}
            onChange={e => { setPage(0); setFilters(p => ({ ...p, status: e.target.value })) }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <UserFilter value={filters.userId} onChange={v => { setPage(0); setFilters(p => ({ ...p, userId: v })) }} />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Item Name','SKU','Rate','Category','Brand','Status','Qty','Supplier','Added','Actions'].map(h =>
                  <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10}><Spinner /></td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={10}><EmptyState message="No inventory items found" /></td></tr>
              ) : data?.content?.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{item.itemName}</td>
                  <td className="table-td font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="table-td font-bold">{fmt(item.rate)}</td>
                  <td className="table-td text-gray-500">{item.category || '—'}</td>
                  <td className="table-td text-gray-500">{item.brand || '—'}</td>
                  <td className="table-td"><Badge label={item.status} /></td>
                  <td className="table-td text-gray-500">{item.quantity} {item.unit}</td>
                  <td className="table-td text-gray-500">{item.supplier || '—'}</td>
                  <td className="table-td text-gray-400 text-xs">{item.createdAt?.slice(0,10)}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirm(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item / Product Name *</label>
              <input className="input" placeholder="e.g. Samsung 55 inch TV" value={form.itemName} onChange={e => f('itemName', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU / Item Code *</label>
              <input className="input" placeholder="SKU-001" value={form.sku} onChange={e => f('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Rate (₹) *</label>
              <input type="number" className="input" value={form.rate} onChange={e => f('rate', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Electronics, Furniture" value={form.category} onChange={e => f('category', e.target.value)} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" placeholder="e.g. Samsung, LG" value={form.brand} onChange={e => f('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" value={form.quantity} onChange={e => f('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => f('unit', e.target.value)}>
                {['PCS','KG','LTR','MTR','BOX','SET','PAIR','DOZEN'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" placeholder="Scan or enter barcode" value={form.barcode} onChange={e => f('barcode', e.target.value)} />
            </div>
            <div>
              <label className="label">HSN Code</label>
              <input className="input" placeholder="HSN code for GST" value={form.hsnCode} onChange={e => f('hsnCode', e.target.value)} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input" placeholder="Supplier name" value={form.supplier} onChange={e => f('supplier', e.target.value)} />
            </div>
            <div>
              <label className="label">Location / Shelf</label>
              <input className="input" placeholder="e.g. Rack A, Shelf 2" value={form.location} onChange={e => f('location', e.target.value)} />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={form.purchaseDate} onChange={e => f('purchaseDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-20 resize-none" value={form.notes} onChange={e => f('notes', e.target.value)} />
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
