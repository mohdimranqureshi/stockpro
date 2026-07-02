import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { paymentApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination, StatCard } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const MODES = ['CASH','UPI','BANK_TRANSFER','CHEQUE','EMI','CARD']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const EMPTY = { flowType:'INFLOW', amount:'', paymentDate: new Date().toISOString().slice(0,10),
  partyName:'', paymentMode:'CASH', referenceNo:'', category:'PRODUCT', notes:'' }

export default function PaymentsPage() {
  const [data, setData]     = useState(null)
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(0)
  const [filters, setFilters] = useState({ flowType:'', from:'', to:'', userId:'' })
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 15 }
    if (filters.flowType) params.flowType = filters.flowType
    if (filters.from) params.from = filters.from
    if (filters.to)   params.to   = filters.to
    if (filters.userId) params.userId = filters.userId
    Promise.all([paymentApi.list(params), paymentApi.totals(filters.userId || undefined)])
      .then(([r, t]) => { setData(r.data.data); setTotals(t.data.data) })
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.amount || !form.partyName) return toast.error('Amount & party required')
    setSaving(true)
    try {
      await paymentApi.create({ ...form, amount: parseFloat(form.amount) })
      toast.success('Payment recorded')
      setModal(false); setForm(EMPTY); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Inflow"  value={fmt(totals.totalInflow)}  icon={TrendingUp}   color="green" />
          <StatCard label="Total Outflow" value={fmt(totals.totalOutflow)} icon={TrendingDown} color="red" />
          <StatCard label="Net Cash"      value={fmt(totals.netCash)}      icon={totals.netCash >= 0 ? TrendingUp : TrendingDown} color={totals.netCash >= 0 ? 'green' : 'red'} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="input w-36" value={filters.flowType} onChange={e => { setPage(0); setFilters(p=>({...p,flowType:e.target.value}))}}>
            <option value="">All Flows</option>
            <option value="INFLOW">Inflow</option>
            <option value="OUTFLOW">Outflow</option>
          </select>
          <input type="date" className="input w-40" value={filters.from} onChange={e => { setPage(0); setFilters(p=>({...p,from:e.target.value}))}} />
          <input type="date" className="input w-40" value={filters.to}   onChange={e => { setPage(0); setFilters(p=>({...p,to:e.target.value}))}} />
          <UserFilter value={filters.userId} onChange={v => { setPage(0); setFilters(p=>({...p,userId:v}))}} />
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Payment
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Flow','Party','Amount','Mode','Reference','Category','Date'].map(h =>
                  <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7}><Spinner /></td></tr>
              : data?.content?.length === 0 ? <tr><td colSpan={7}><EmptyState /></td></tr>
              : data?.content?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-td"><Badge label={p.flowType} /></td>
                  <td className="table-td font-medium">{p.partyName}</td>
                  <td className="table-td font-bold">{fmt(p.amount)}</td>
                  <td className="table-td"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{p.paymentMode?.replace(/_/g,' ')}</span></td>
                  <td className="table-td text-xs text-gray-400 font-mono">{p.referenceNo || '—'}</td>
                  <td className="table-td text-xs text-gray-500">{p.category}</td>
                  <td className="table-td text-xs text-gray-400">{p.paymentDate}</td>
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
        <Modal title="Record Payment" onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Flow Type *</label>
              <select className="input" value={form.flowType} onChange={e => f('flowType', e.target.value)}>
                <option value="INFLOW">Inflow (Received)</option>
                <option value="OUTFLOW">Outflow (Paid)</option>
              </select>
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input className="input" type="number" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="label">Party Name *</label>
              <input className="input" value={form.partyName} onChange={e => f('partyName', e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={form.paymentMode} onChange={e => f('paymentMode', e.target.value)}>
                {MODES.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.paymentDate} onChange={e => f('paymentDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Reference No.</label>
              <input className="input" value={form.referenceNo} onChange={e => f('referenceNo', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => f('category', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
