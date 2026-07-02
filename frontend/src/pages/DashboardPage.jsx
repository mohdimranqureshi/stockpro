import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Package, TrendingUp, TrendingDown, IndianRupee, RefreshCcw, Trash2, ArrowUpDown } from 'lucide-react'
import { dashboardApi } from '../lib/api'
import { StatCard, Spinner, Badge } from '../components/ui'
import UserFilter from '../components/ui/UserFilter'

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    dashboardApi.summary(userId || undefined)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />
  if (!data) return null

  const pl = data.netProfitLoss || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <UserFilter value={userId} onChange={setUserId} />
      </div>

      {userId && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700">
          Showing data for selected user only
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stock"    value={data.totalStock}    sub={`${data.availableStock} available`} icon={Package}        color="blue" />
        <StatCard label="Sales Revenue"  value={fmt(data.totalSalesRevenue)}  sub="All time"               icon={TrendingUp}      color="green" />
        <StatCard label="Purchase Cost"  value={fmt(data.totalPurchaseCost)}  sub="All time"               icon={TrendingDown}    color="red" />
        <StatCard label="Net P&L"        value={fmt(Math.abs(pl))}  sub={pl >= 0 ? 'Profit' : 'Loss'}      icon={IndianRupee}     color={pl >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cash Inflow"    value={fmt(data.totalInflow)}   sub="Received"    icon={TrendingUp}  color="green" />
        <StatCard label="Cash Outflow"   value={fmt(data.totalOutflow)}  sub="Paid out"    icon={TrendingDown} color="red" />
        <StatCard label="Replacements"   value={data.totalReplacements}  sub="Exchanges"   icon={RefreshCcw}  color="purple" />
        <StatCard label="Scrap Tagged"   value={data.scrapTagged}        sub="For sale"    icon={Trash2}      color="orange" />
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly P&L Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Monthly P&L (This Year)</h3>
          {data.monthlyProfitLoss?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthlyProfitLoss} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="sales"     name="Sales"     fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="profitLoss" name="P&L"      fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">No data yet</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-gray-800">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentTransactions?.length > 0
              ? data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.itemName}</p>
                      <p className="text-xs text-gray-400">{tx.partyName} · {tx.transactionDate}</p>
                    </div>
                    <div className="text-right">
                      <Badge label={tx.type} />
                      <p className="text-sm font-bold text-gray-700 mt-1">{fmt(tx.finalAmount)}</p>
                    </div>
                  </div>
                ))
              : <p className="text-center text-gray-400 py-10 text-sm">No transactions yet</p>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
