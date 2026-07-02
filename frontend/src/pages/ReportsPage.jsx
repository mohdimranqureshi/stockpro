import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { transactionApi } from '../lib/api'
import { Spinner } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const fmtK = (v) => '₹' + (v / 1000).toFixed(0) + 'k'

export default function ReportsPage() {
  const [year, setYear]     = useState(new Date().getFullYear())
  const [userId, setUserId] = useState('')
  const [rows, setRows]     = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      transactionApi.monthlyPL(year, userId || undefined),
      transactionApi.summary(userId || undefined),
    ]).then(([plRes, sumRes]) => {
      const rawRows = plRes.data.data || []
      setRows(rawRows.map(r => ({
        month: r.month || r[0],
        sales: parseFloat(r.sales || r[1] || 0),
        purchases: parseFloat(r.purchases || r[2] || 0),
        profitLoss: parseFloat(r.profitLoss ?? ((r.sales || r[1] || 0) - (r.purchases || r[2] || 0))),
      })))
      setSummary(sumRes.data.data)
    }).finally(() => setLoading(false))
  }, [year, userId])

  const totalPL = rows.reduce((a, r) => a + r.profitLoss, 0)
  const bestMonth = rows.length ? rows.reduce((a, b) => b.profitLoss > a.profitLoss ? b : a, rows[0]) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-800">Profit & Loss Report</h2>
        <div className="flex gap-2 flex-wrap">
          <UserFilter value={userId} onChange={setUserId} />
          <select
            className="input w-32"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
          >
            {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-5 bg-blue-50 border-0">
                <p className="text-xs font-semibold text-blue-600 uppercase">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(summary.totalSales)}</p>
              </div>
              <div className="card p-5 bg-red-50 border-0">
                <p className="text-xs font-semibold text-red-600 uppercase">Total Cost</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{fmt(summary.totalPurchases)}</p>
              </div>
              <div className={`card p-5 border-0 ${totalPL >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-semibold uppercase ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {year} Net {totalPL >= 0 ? 'Profit' : 'Loss'}
                </p>
                <p className={`text-2xl font-bold mt-1 ${totalPL >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {fmt(Math.abs(totalPL))}
                </p>
                {bestMonth && <p className="text-xs text-gray-500 mt-1">Best: {bestMonth.month}</p>}
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="card p-16 text-center text-gray-400">No transaction data for {year}</div>
          ) : (
            <>
              {/* Bar Chart */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-700 mb-4">Monthly Sales vs Purchases</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={rows} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={fmt} />
                    <Legend />
                    <Bar dataKey="sales"     name="Sales Revenue" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="purchases" name="Purchase Cost"  fill="#3b82f6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* P&L Trend */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-700 mb-4">Monthly Profit / Loss Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rows} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={fmt} />
                    <Line
                      type="monotone" dataKey="profitLoss" name="P&L"
                      stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* P&L Table */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700">Month-wise Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-th">Month</th>
                        <th className="table-th">Sales Revenue</th>
                        <th className="table-th">Purchase Cost</th>
                        <th className="table-th">Gross Profit / Loss</th>
                        <th className="table-th">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => {
                        const margin = row.sales > 0 ? ((row.profitLoss / row.sales) * 100).toFixed(1) : 0
                        return (
                          <tr key={row.month} className="hover:bg-gray-50">
                            <td className="table-td font-semibold">{row.month}</td>
                            <td className="table-td text-emerald-700 font-semibold">{fmt(row.sales)}</td>
                            <td className="table-td text-red-600 font-semibold">{fmt(row.purchases)}</td>
                            <td className="table-td">
                              <span className={`font-bold ${row.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {row.profitLoss >= 0 ? '+' : ''}{fmt(row.profitLoss)}
                              </span>
                            </td>
                            <td className="table-td">
                              <span className={`text-sm font-medium ${parseFloat(margin) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {margin}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      {/* Totals row */}
                      <tr className="bg-gray-50 font-bold">
                        <td className="table-td font-bold">TOTAL</td>
                        <td className="table-td text-emerald-700">{fmt(rows.reduce((a,r) => a + r.sales, 0))}</td>
                        <td className="table-td text-red-600">{fmt(rows.reduce((a,r) => a + r.purchases, 0))}</td>
                        <td className="table-td">
                          <span className={totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {totalPL >= 0 ? '+' : ''}{fmt(totalPL)}
                          </span>
                        </td>
                        <td className="table-td">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
