import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { replacementApi } from '../lib/api'
import { Modal, Spinner, EmptyState, Pagination } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const EMPTY = {
  customerName:'', customerPhone:'', givenStockId:'',
  givenItemName:'', givenSku:'', givenValue:'0',
  receivedItemName:'', receivedSku:'', receivedValue:'0',
  differenceAmount:'0', replacementDate: new Date().toISOString().slice(0,10), notes:''
}

export default function ReplacementsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [userId, setUserId]   = useState('')
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 15 }
    if (userId) params.userId = userId
    replacementApi.list(params)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [page, userId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.customerName || !form.givenItemName || !form.receivedItemName)
      return toast.error('Customer name, given & received item are required')
    setSaving(true)
    try {
      await replacementApi.create({
        ...form,
        givenValue:       parseFloat(form.givenValue       || 0),
        receivedValue:    parseFloat(form.receivedValue    || 0),
        differenceAmount: parseFloat(form.differenceAmount || 0),
        givenStockId:     form.givenStockId ? parseInt(form.givenStockId) : null,
      })
      toast.success('Replacement recorded')
      setModal(false); setForm(EMPTY); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <UserFilter value={userId} onChange={v => { setPage(0); setUserId(v) }} />
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Replacement
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Customer','Phone','Item Given','SKU','Given Value','Item Received','SKU','Received Value','Diff Amt','Date'].map(h =>
                  <th key={h} className="table-th whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10}><Spinner /></td></tr>
              : data?.content?.length === 0 ? <tr><td colSpan={10}><EmptyState message="No replacements found" /></td></tr>
              : data?.content?.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{r.customerName}</td>
                  <td className="table-td text-sm text-gray-500">{r.customerPhone || '—'}</td>
                  <td className="table-td text-orange-700 font-medium">{r.givenItemName}</td>
                  <td className="table-td text-xs font-mono text-gray-400">{r.givenSku || '—'}</td>
                  <td className="table-td">{fmt(r.givenValue)}</td>
                  <td className="table-td text-emerald-700 font-medium">{r.receivedItemName}</td>
                  <td className="table-td text-xs font-mono text-gray-400">{r.receivedSku || '—'}</td>
                  <td className="table-td">{fmt(r.receivedValue)}</td>
                  <td className="table-td font-bold">{fmt(r.differenceAmount)}</td>
                  <td className="table-td text-xs text-gray-400">{r.replacementDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={data?.totalPages || 0} onChange={setPage} />
        </div>
      </div>

      {modal && (
        <Modal title="Add Replacement / Exchange" onClose={() => setModal(false)} size="xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input className="input" placeholder="Customer name" value={form.customerName} onChange={e => f('customerName', e.target.value)} />
            </div>
            <div>
              <label className="label">Customer Phone</label>
              <input type="tel" className="input" placeholder="9876543210" value={form.customerPhone} onChange={e => f('customerPhone', e.target.value)} />
            </div>

            <div className="col-span-2 border-t pt-4">
              <p className="text-sm font-semibold text-orange-600 mb-3">🔴 Item Given to Customer (New / Outgoing)</p>
            </div>
            <div>
              <label className="label">Item Name *</label>
              <input className="input" placeholder="e.g. Samsung 55 inch TV" value={form.givenItemName} onChange={e => f('givenItemName', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU / Code</label>
              <input className="input" placeholder="SKU-001" value={form.givenSku} onChange={e => f('givenSku', e.target.value)} />
            </div>
            <div>
              <label className="label">Given Value (₹)</label>
              <input type="number" className="input" placeholder="0" value={form.givenValue} onChange={e => f('givenValue', e.target.value)} />
            </div>
            <div>
              <label className="label">Stock ID (optional)</label>
              <input type="number" className="input" placeholder="Link to inventory" value={form.givenStockId} onChange={e => f('givenStockId', e.target.value)} />
            </div>

            <div className="col-span-2 border-t pt-4">
              <p className="text-sm font-semibold text-emerald-600 mb-3">🟢 Item Received from Customer (Old / Incoming)</p>
            </div>
            <div>
              <label className="label">Item Name *</label>
              <input className="input" placeholder="e.g. Old LG TV" value={form.receivedItemName} onChange={e => f('receivedItemName', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU / Code</label>
              <input className="input" placeholder="OLD-001" value={form.receivedSku} onChange={e => f('receivedSku', e.target.value)} />
            </div>
            <div>
              <label className="label">Received Value (₹)</label>
              <input type="number" className="input" placeholder="0" value={form.receivedValue} onChange={e => f('receivedValue', e.target.value)} />
            </div>
            <div>
              <label className="label">Difference Amount (₹)</label>
              <input type="number" className="input" placeholder="Customer pays this" value={form.differenceAmount} onChange={e => f('differenceAmount', e.target.value)} />
            </div>

            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.replacementDate} onChange={e => f('replacementDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Record Replacement'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
