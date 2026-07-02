import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil } from 'lucide-react'
import { scrapApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const STATUSES = ['TAGGED_FOR_SALE','SOLD','PENDING_EVALUATION','DISMANTLED']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const EMPTY = {
  itemName:'', sku:'', barcode:'', estimatedValue:'0', soldVal:'',
  status:'TAGGED_FOR_SALE', scrapDate: new Date().toISOString().slice(0,10),
  source:'', buyerName:'', notes:''
}

export default function ScrapPage() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [filterStatus, setFilter] = useState('')
  const [userId, setUserId]     = useState('')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 15 }
    if (filterStatus) params.status = filterStatus
    if (userId)       params.userId = userId
    scrapApi.list(params)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [page, filterStatus, userId])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal('form') }
  const openEdit = (item) => {
    setForm({ ...item, estimatedValue: String(item.estimatedValue || 0), soldVal: String(item.soldValue || '') })
    setEditId(item.id); setModal('form')
  }

  const handleSave = async () => {
    if (!form.itemName) return toast.error('Item name is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        estimatedValue: parseFloat(form.estimatedValue || 0),
        soldValue:      form.soldVal ? parseFloat(form.soldVal) : null,
      }
      if (editId) await scrapApi.update(editId, payload)
      else        await scrapApi.create(payload)
      toast.success(editId ? 'Scrap item updated' : 'Scrap item added')
      setModal(null); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="input w-52" value={filterStatus} onChange={e => { setPage(0); setFilter(e.target.value) }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <UserFilter value={userId} onChange={v => { setPage(0); setUserId(v) }} />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Scrap Item
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Item Name','SKU','Barcode','Est. Value','Sold Value','Status','Source','Buyer','Date','Edit'].map(h =>
                  <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10}><Spinner /></td></tr>
              : data?.content?.length === 0 ? <tr><td colSpan={10}><EmptyState message="No scrap items found" /></td></tr>
              : data?.content?.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{s.itemName}</td>
                  <td className="table-td text-xs font-mono text-gray-400">{s.sku || '—'}</td>
                  <td className="table-td text-xs text-gray-400">{s.barcode || '—'}</td>
                  <td className="table-td font-bold">{fmt(s.estimatedValue)}</td>
                  <td className="table-td">{s.soldValue ? fmt(s.soldValue) : '—'}</td>
                  <td className="table-td"><Badge label={s.status} /></td>
                  <td className="table-td text-gray-500">{s.source || '—'}</td>
                  <td className="table-td text-gray-500">{s.buyerName || '—'}</td>
                  <td className="table-td text-xs text-gray-400">{s.scrapDate}</td>
                  <td className="table-td">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
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
        <Modal title={editId ? 'Edit Scrap Item' : 'Add Scrap / Dead Stock Item'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name *</label>
              <input className="input" placeholder="e.g. LG CRT TV 2015" value={form.itemName} onChange={e => f('itemName', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU / Item Code</label>
              <input className="input" placeholder="SCR-003" value={form.sku} onChange={e => f('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" placeholder="Scan or enter barcode" value={form.barcode} onChange={e => f('barcode', e.target.value)} />
            </div>
            <div>
              <label className="label">Estimated Value (₹)</label>
              <input type="number" className="input" placeholder="0" value={form.estimatedValue} onChange={e => f('estimatedValue', e.target.value)} />
            </div>
            <div>
              <label className="label">Sold Value (₹)</label>
              <input type="number" className="input" placeholder="Leave blank if unsold" value={form.soldVal} onChange={e => f('soldVal', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.scrapDate} onChange={e => f('scrapDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Source</label>
              <input className="input" placeholder="e.g. Trade-in / Exchange / Damaged" value={form.source} onChange={e => f('source', e.target.value)} />
            </div>
            <div>
              <label className="label">Buyer Name</label>
              <input className="input" placeholder="Scrap buyer / dealer" value={form.buyerName} onChange={e => f('buyerName', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editId ? 'Update Item' : 'Add Scrap Item'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
