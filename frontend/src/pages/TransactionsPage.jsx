import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { transactionApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const MODES = ['CASH','UPI','BANK_TRANSFER','CHEQUE','EMI','CARD']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const EMPTY = {
  type:'SALE', stockId:'', itemName:'', sku:'', partyName:'', partyPhone:'',
  partyGstin:'', amount:'', discount:'0', taxAmount:'0',
  transactionDate: new Date().toISOString().slice(0,10),
  invoiceNo:'', paymentMode:'CASH', notes:''
}

export default function TransactionsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [filters, setFilters] = useState({ type:'', from:'', to:'', party:'', userId:'' })
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 15 }
    if (filters.type)   params.type   = filters.type
    if (filters.from)   params.from   = filters.from
    if (filters.to)     params.to     = filters.to
    if (filters.party)  params.party  = filters.party
    if (filters.userId) params.userId = filters.userId
    transactionApi.list(params)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.itemName || !form.amount || !form.partyName) return toast.error('Item name, amount & party are required')
    setSaving(true)
    try {
      await transactionApi.create({
        ...form,
        amount:    parseFloat(form.amount),
        discount:  parseFloat(form.discount  || 0),
        taxAmount: parseFloat(form.taxAmount || 0),
        stockId:   form.stockId ? parseInt(form.stockId) : null,
      })
      toast.success('Transaction recorded')
      setModal(false); setForm(EMPTY); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="input w-36" value={filters.type} onChange={e => { setPage(0); setFilters(p=>({...p,type:e.target.value}))}}>
            <option value="">All Types</option>
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
          </select>
          <input type="date" className="input w-40" value={filters.from} onChange={e => { setPage(0); setFilters(p=>({...p,from:e.target.value}))}} />
          <input type="date" className="input w-40" value={filters.to}   onChange={e => { setPage(0); setFilters(p=>({...p,to:e.target.value}))}} />
          <input className="input w-40" placeholder="Party name" value={filters.party} onChange={e => { setPage(0); setFilters(p=>({...p,party:e.target.value}))}} />
          <UserFilter value={filters.userId} onChange={v => { setPage(0); setFilters(p=>({...p,userId:v}))}} />
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Type','Item Name','SKU','Party','Amount','Discount','Final','Date','Mode','Invoice'].map(h =>
                  <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10}><Spinner /></td></tr>
              : data?.content?.length === 0 ? <tr><td colSpan={10}><EmptyState message="No transactions found" /></td></tr>
              : data?.content?.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="table-td"><Badge label={tx.type} /></td>
                  <td className="table-td font-medium">{tx.itemName}</td>
                  <td className="table-td text-xs font-mono text-gray-500">{tx.sku || '—'}</td>
                  <td className="table-td">{tx.partyName}</td>
                  <td className="table-td">{fmt(tx.amount)}</td>
                  <td className="table-td text-red-500">{tx.discount > 0 ? `-${fmt(tx.discount)}` : '—'}</td>
                  <td className="table-td font-bold">{fmt(tx.finalAmount)}</td>
                  <td className="table-td text-xs text-gray-400">{tx.transactionDate}</td>
                  <td className="table-td"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tx.paymentMode?.replace(/_/g,' ')}</span></td>
                  <td className="table-td text-xs text-gray-400 font-mono">{tx.invoiceNo || '—'}</td>
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
        <Modal title="Record Transaction" onClose={() => setModal(false)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => f('type', e.target.value)}>
                <option value="SALE">Sale (Selling to customer)</option>
                <option value="PURCHASE">Purchase (Buying from supplier)</option>
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.transactionDate} onChange={e => f('transactionDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Item / Product Name *</label>
              <input className="input" placeholder="Enter item name" value={form.itemName} onChange={e => f('itemName', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU / Item Code</label>
              <input className="input" placeholder="SKU-001" value={form.sku} onChange={e => f('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Link Stock ID (optional)</label>
              <input type="number" className="input" placeholder="From inventory" value={form.stockId} onChange={e => f('stockId', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Party Name *</label>
              <input className="input" placeholder="Customer / Supplier name" value={form.partyName} onChange={e => f('partyName', e.target.value)} />
            </div>
            <div>
              <label className="label">Party Phone</label>
              <input type="tel" className="input" placeholder="9876543210" value={form.partyPhone} onChange={e => f('partyPhone', e.target.value)} />
            </div>
            <div>
              <label className="label">Party GSTIN</label>
              <input className="input" placeholder="22AAAAA0000A1Z5" value={form.partyGstin} onChange={e => f('partyGstin', e.target.value)} />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" placeholder="0" value={form.amount} onChange={e => f('amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" className="input" placeholder="0" value={form.discount} onChange={e => f('discount', e.target.value)} />
            </div>
            <div>
              <label className="label">Tax / GST Amount (₹)</label>
              <input type="number" className="input" placeholder="0" value={form.taxAmount} onChange={e => f('taxAmount', e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={form.paymentMode} onChange={e => f('paymentMode', e.target.value)}>
                {MODES.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice / Bill No.</label>
              <input className="input" placeholder="INV-001" value={form.invoiceNo} onChange={e => f('invoiceNo', e.target.value)} />
            </div>
            {form.amount && (
              <div className="col-span-2 bg-blue-50 rounded-lg px-4 py-3">
                <p className="text-xs text-blue-600 font-semibold">Final Amount Preview</p>
                <p className="text-lg font-bold text-blue-700">
                  {fmt(parseFloat(form.amount||0) - parseFloat(form.discount||0) + parseFloat(form.taxAmount||0))}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Record Transaction'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
