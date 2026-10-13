import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, ChevronDown, X } from 'lucide-react'
import { transactionApi, stockApi, gstApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, Pagination } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'
import HsnDropdown from '../components/ui/HsnDropdown'

const MODES = ['CASH','UPI','BANK_TRANSFER','CHEQUE','EMI','CARD']
const SCRAP_TYPES = ['Iron / Steel','Aluminium','Copper','Brass','Plastic','Rubber','Glass','E-Waste','Mixed Metal','Other']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const safe = (v) => parseFloat(v) || 0

const EMPTY = {
  type:'SALE',
  stockId:'', itemName:'', sku:'', serialNumber:'', vehicleNumber:'',
  hsnCode:'', gstRate:'', taxAmount:'',
  partyName:'', partyPhone:'', partyGstin:'',
  amount:'', discount:'0',
  scrapType:'', scrapWeight:'', scrapRate:'', scrapDeduction:'0',
  transactionDate: new Date().toISOString().slice(0,10),
  invoiceNo:'', paymentMode:'CASH', notes:''
}

// ── Searchable Stock Dropdown ─────────────────────────────────
function StockDropdown({ value, onSelect, disabled }) {
  const [query, setQuery]       = useState('')
  const [options, setOptions]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState(null)
  const ref = useRef(null)
  const debounce = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q) => {
    setLoading(true)
    stockApi.list({ status: 'AVAILABLE', name: q, size: 30 })
      .then(r => setOptions(r.data.data?.content || []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (open) search(query) }, [open])

  const handleType = (e) => {
    const q = e.target.value
    setQuery(q); setSelected(null); onSelect(null)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(q), 300)
  }

  const handlePick = (item) => {
    setSelected(item); setQuery(item.itemName); setOpen(false); onSelect(item)
  }

  const handleClear = () => {
    setSelected(null); setQuery(''); onSelect(null); search('')
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className={`input pl-9 pr-10 w-full ${selected ? 'border-emerald-400 bg-emerald-50' : ''}`}
          placeholder="Search item name or serial no..."
          value={query} onChange={handleType} onFocus={() => setOpen(true)} disabled={disabled}
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={selected ? handleClear : () => setOpen(o => !o)}>
          {selected ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {loading
            ? <div className="px-4 py-3 text-sm text-gray-400 text-center">Searching...</div>
            : options.length === 0
            ? <div className="px-4 py-3 text-sm text-gray-400 text-center">No available items found</div>
            : options.map(item => (
              <button key={item.id} type="button"
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                onClick={() => handlePick(item)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.itemName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      S/N: {item.sku || '—'}
                      {item.challanNumber ? ` · Challan: ${item.challanNumber}` : ''}
                      {item.brand ? ` · ${item.brand}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 ml-4 flex-shrink-0">{fmt(item.rate)}</span>
                </div>
              </button>
            ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
          ✅ {selected.itemName} · Rate: <strong>{fmt(selected.rate)}</strong>
          {selected.challanNumber ? ` · Challan: ${selected.challanNumber}` : ''}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
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

  // Auto-fetch invoice number when modal opens
  const openModal = async () => {
    setForm(EMPTY)
    try {
      const res = await transactionApi.nextInvoice()
      setForm(p => ({ ...p, invoiceNo: res.data.data }))
    } catch { /* fallback: leave blank, backend will assign */ }
    setModal(true)
  }

  // Stock item selected from dropdown
  const handleStockSelect = (item) => {
    if (!item) { setForm(p => ({ ...p, stockId:'', itemName:'', sku:'', amount:'' })); return }
    setForm(p => ({
      ...p,
      stockId:  String(item.id),
      itemName: item.itemName,
      sku:      item.sku || '',
      amount:   String(item.rate),
      hsnCode:  item.hsnCode || p.hsnCode,
    }))
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Recalculate tax whenever amount or gstRate changes
  const handleAmountChange = (v) => {
    const amt = safe(v)
    const tax = form.gstRate ? ((amt * safe(form.gstRate)) / 100).toFixed(2) : form.taxAmount
    setForm(p => ({ ...p, amount: v, taxAmount: tax }))
  }

  const handleGstRateChange = (v) => {
    const tax = ((safe(form.amount) * safe(v)) / 100).toFixed(2)
    setForm(p => ({ ...p, gstRate: v, taxAmount: tax }))
  }

  // Recalculate scrap deduction whenever scrap rate or weight changes
  const handleScrapChange = (field, v) => {
    setForm(p => {
      const updated = { ...p, [field]: v }
      const deduction = (safe(updated.scrapWeight) * safe(updated.scrapRate)).toFixed(2)
      return { ...updated, scrapDeduction: deduction }
    })
  }

  // Final computed amount
  const baseAmount   = safe(form.amount)
  const discount     = safe(form.discount)
  const tax          = safe(form.taxAmount)
  const scrapDed     = safe(form.scrapDeduction)
  const finalAmount  = baseAmount - discount + tax - scrapDed

  const handleSave = async () => {
    if (!form.itemName || !form.amount || !form.partyName)
      return toast.error('Item, amount & party name are required')
    setSaving(true)
    try {
      await transactionApi.create({
        ...form,
        amount:         parseFloat(form.amount),
        discount:       safe(form.discount),
        taxAmount:      safe(form.taxAmount),
        gstRate:        safe(form.gstRate),
        scrapWeight:    safe(form.scrapWeight),
        scrapRate:      safe(form.scrapRate),
        scrapDeduction: safe(form.scrapDeduction),
        stockId:        form.stockId ? parseInt(form.stockId) : null,
      })
      toast.success(
        form.type === 'SALE' && form.stockId
          ? 'Sale recorded — item removed from available stock'
          : 'Transaction recorded'
      )
      setModal(false); setForm(EMPTY); load()
    } catch(e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
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
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Invoice','Type','Item','Serial No','Vehicle No','Party','Amount','Disc','Tax','Scrap Ded','Final','Date','Mode'].map(h =>
                  <th key={h} className="table-th whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={13}><Spinner /></td></tr>
                : data?.content?.length === 0
                ? <tr><td colSpan={13}><EmptyState message="No transactions found" /></td></tr>
                : data?.content?.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-blue-600">{tx.invoiceNo || '—'}</td>
                    <td className="table-td"><Badge label={tx.type} /></td>
                    <td className="table-td font-medium">{tx.itemName}</td>
                    <td className="table-td text-xs font-mono text-gray-500">{tx.serialNumber || tx.sku || '—'}</td>
                    <td className="table-td text-xs text-gray-500">{tx.vehicleNumber || '—'}</td>
                    <td className="table-td">{tx.partyName}</td>
                    <td className="table-td">{fmt(tx.amount)}</td>
                    <td className="table-td text-red-500 text-xs">{tx.discount > 0 ? `-${fmt(tx.discount)}` : '—'}</td>
                    <td className="table-td text-xs">{tx.taxAmount > 0 ? `+${fmt(tx.taxAmount)}` : '—'}</td>
                    <td className="table-td text-xs text-orange-600">{tx.scrapDeduction > 0 ? `-${fmt(tx.scrapDeduction)}` : '—'}</td>
                    <td className="table-td font-bold">{fmt(tx.finalAmount)}</td>
                    <td className="table-td text-xs text-gray-400">{tx.transactionDate}</td>
                    <td className="table-td"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tx.paymentMode?.replace(/_/g,' ')}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={data?.totalPages || 0} onChange={setPage} />
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title="Record Transaction" onClose={() => setModal(false)} size="xl">
          <div className="grid grid-cols-2 gap-4">

            {/* ── Row 1: Type + Date + Invoice ── */}
            <div>
              <label className="label">Transaction Type *</label>
              <select className="input" value={form.type} onChange={e => {
                const t = e.target.value
                setForm(p => ({ ...p, type: t, stockId:'', itemName:'', sku:'', amount: t==='PURCHASE' ? '' : p.amount }))
              }}>
                <option value="SALE">Sale — Selling to customer</option>
                <option value="PURCHASE">Purchase — Buying from supplier</option>
              </select>
            </div>
            <div>
              <label className="label">Invoice Number</label>
              <input className="input font-mono bg-blue-50 border-blue-200" value={form.invoiceNo}
                onChange={e => f('invoiceNo', e.target.value)}
                placeholder="Auto-assigned on save" />
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.transactionDate} onChange={e => f('transactionDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={form.paymentMode} onChange={e => f('paymentMode', e.target.value)}>
                {MODES.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>

            {/* ── Row 2: Item Selection ── */}
            <div className="col-span-2">
              {form.type === 'SALE' ? (
                <>
                  <label className="label">Select Item from Stock (Available Only) *</label>
                  <StockDropdown value={form.stockId} onSelect={handleStockSelect} />
                  {form.stockId && (
                    <p className="mt-1.5 text-xs text-amber-600 font-medium">
                      ⚠️ This item will be marked as SOLD and removed from available stock
                    </p>
                  )}
                </>
              ) : (
                <>
                  <label className="label">Item / Product Name *</label>
                  <input className="input" placeholder="Enter item being purchased" value={form.itemName} onChange={e => f('itemName', e.target.value)} />
                </>
              )}
            </div>

            {/* ── Row 3: Serial + Vehicle ── */}
            <div>
              <label className="label">Serial Number</label>
              <input className="input" placeholder="e.g. SN-2026-001"
                value={form.serialNumber} onChange={e => f('serialNumber', e.target.value)}
                readOnly={form.type === 'SALE' && !!form.stockId} />
            </div>
            <div>
              <label className="label">Vehicle Number</label>
              <input className="input" placeholder="e.g. DL 01 AB 1234" value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} />
            </div>

            {/* ── Row 4: Party ── */}
            <div className="col-span-2 bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {form.type === 'SALE' ? 'Customer Details' : 'Supplier Details'}
                </p>
              </div>
              <div>
                <label className="label">{form.type === 'SALE' ? 'Customer' : 'Supplier'} Name *</label>
                <input className="input" placeholder="Name" value={form.partyName} onChange={e => f('partyName', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="9876543210" value={form.partyPhone} onChange={e => f('partyPhone', e.target.value)} />
              </div>
              <div>
                <label className="label">GSTIN</label>
                <input className="input" placeholder="22AAAAA0000A1Z5" value={form.partyGstin} onChange={e => f('partyGstin', e.target.value)} />
              </div>
            </div>

            {/* ── Row 5: Amount + HSN + GST ── */}
            <div className="col-span-2 bg-blue-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Pricing & Tax</p>
              </div>
              <div>
                <label className="label">Amount (₹) *</label>
                <input type="number" className="input" placeholder="0" value={form.amount} onChange={e => handleAmountChange(e.target.value)} />
              </div>
              <div>
                <label className="label">Discount (₹)</label>
                <input type="number" className="input" placeholder="0" value={form.discount} onChange={e => f('discount', e.target.value)} />
              </div>

              {/* HSN — auto-fetches GST rate on selection */}
              <div className="col-span-2">
                <label className="label">HSN Code</label>
                <HsnDropdown
                  value={form.hsnCode}
                  onSelect={async (item) => {
                    if (!item) { f('hsnCode', ''); return }
                    f('hsnCode', item.hsnCode)
                    // Auto-fetch GST rate from hsncodefinder.app via backend proxy
                    try {
                      const res = await gstApi.rate(item.hsnCode)
                      const data = res.data.data
                      if (data?.found && data.gstRate != null) {
                        const rate = String(data.gstRate)
                        const tax  = ((safe(form.amount) * parseFloat(rate)) / 100).toFixed(2)
                        setForm(p => ({ ...p, hsnCode: item.hsnCode, gstRate: rate, taxAmount: tax }))
                        toast.success(`GST ${data.gstRate}% fetched for HSN ${item.hsnCode}`, { icon: '✅' })
                      } else {
                        setForm(p => ({ ...p, hsnCode: item.hsnCode }))
                        toast('GST rate not found for this HSN — enter manually', { icon: 'ℹ️' })
                      }
                    } catch {
                      toast.error('Could not fetch GST rate — enter manually')
                    }
                  }}
                  placeholder="Type HSN code or description..."
                />
                <p className="text-xs text-blue-500 mt-1">GST rate will auto-fill when you select an HSN code</p>
              </div>

              {/* GST Rate — read-only if auto-fetched, editable otherwise */}
              <div>
                <label className="label">
                  GST Rate (%)
                  {form.gstRate && (
                    <span className="ml-2 text-xs font-normal text-emerald-600">✓ auto-fetched</span>
                  )}
                </label>
                <input
                  type="number"
                  className={`input ${form.gstRate ? 'bg-emerald-50 border-emerald-300' : ''}`}
                  placeholder="Auto-filled from HSN"
                  value={form.gstRate}
                  onChange={e => handleGstRateChange(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Tax Amount (₹) — auto-calculated</label>
                <input type="number" className="input bg-blue-100" placeholder="0" value={form.taxAmount}
                  onChange={e => f('taxAmount', e.target.value)} />
                {form.gstRate && form.amount && (
                  <p className="text-xs text-blue-600 mt-1">
                    {fmt(safe(form.amount))} × {form.gstRate}% = <strong>{fmt(safe(form.taxAmount))}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* ── Row 6: Scrap Deduction ── */}
            <div className="col-span-2 bg-orange-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 flex justify-between items-center">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Scrap / Trade-in Deduction (optional)</p>
                <p className="text-xs text-orange-500">Scrap amount is subtracted from final total</p>
              </div>
              <div>
                <label className="label">Scrap Type</label>
                <select className="input" value={form.scrapType} onChange={e => f('scrapType', e.target.value)}>
                  <option value="">No scrap deduction</option>
                  {SCRAP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {form.scrapType && (
                <>
                  <div>
                    <label className="label">Scrap Rate (₹ per kg)</label>
                    <input type="number" className="input" placeholder="e.g. 25" value={form.scrapRate}
                      onChange={e => handleScrapChange('scrapRate', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Scrap Weight (kg)</label>
                    <input type="number" step="0.001" className="input" placeholder="e.g. 12.5" value={form.scrapWeight}
                      onChange={e => handleScrapChange('scrapWeight', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Scrap Deduction (₹) — auto-calculated</label>
                    <input type="number" className="input bg-orange-100 font-bold" value={form.scrapDeduction}
                      onChange={e => f('scrapDeduction', e.target.value)} />
                    {form.scrapWeight && form.scrapRate && (
                      <p className="text-xs text-orange-600 mt-1">
                        {form.scrapWeight} kg × ₹{form.scrapRate}/kg = <strong>{fmt(safe(form.scrapDeduction))}</strong>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Final Amount Preview ── */}
            <div className="col-span-2 bg-gray-900 text-white rounded-xl px-5 py-4">
              <div className="grid grid-cols-5 gap-2 text-center text-xs mb-3 text-gray-400">
                <div>Amount<br/><span className="text-white font-bold text-base">{fmt(baseAmount)}</span></div>
                <div>− Discount<br/><span className="text-red-400 font-bold text-base">{fmt(discount)}</span></div>
                <div>+ GST<br/><span className="text-blue-400 font-bold text-base">{fmt(tax)}</span></div>
                <div>− Scrap<br/><span className="text-orange-400 font-bold text-base">{fmt(scrapDed)}</span></div>
                <div>= Final<br/><span className="text-emerald-400 font-bold text-xl">{fmt(finalAmount)}</span></div>
              </div>
              <div className="text-center">
                <span className="text-emerald-400 font-black text-2xl">{fmt(finalAmount)}</span>
                <span className="text-gray-400 text-sm ml-2">Final Amount</span>
              </div>
            </div>

            {/* Invoice + Notes */}
            <div>
              <label className="label">Invoice / Bill No.</label>
              <input className="input font-mono" placeholder="Auto-assigned" value={form.invoiceNo} onChange={e => f('invoiceNo', e.target.value)} />
            </div>
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
