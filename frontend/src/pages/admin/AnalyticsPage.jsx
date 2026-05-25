import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingBag, Users, IndianRupee, Package, Star, BarChart2, RefreshCcw } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

function SimpleBar({ label, value, max, color = 'bg-primary-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-dark-700 rounded-full h-2.5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${color}`} />
      </div>
      <span className="w-12 text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/admin/dashboard')
      setData(res)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Build daily revenue map from revenueData
  const dailyRevenue = (() => {
    if (!data?.revenueData) return []
    const map = {}
    data.revenueData.forEach(o => {
      const day = o.created_at?.slice(0, 10) || ''
      map[day] = (map[day] || 0) + Number(o.total_amount)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // last 14 days
  })()

  const maxRevDay = Math.max(...dailyRevenue.map(([, v]) => v), 1)

  const topProducts = data?.topProducts || []
  const maxSold     = Math.max(...topProducts.map(p => p.sold_count || 0), 1)

  const statusCounts = (() => {
    const orders = data?.recentOrders || []
    const map = {}
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1 })
    return Object.entries(map)
  })()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business performance overview</p>
        </div>
        <button onClick={load} className="btn-outline gap-2 py-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue (30d)" icon={IndianRupee} color="bg-primary-500"
          value={`₹${Number(data?.stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          sub="Paid orders only" />
        <StatCard label="Total Orders" icon={ShoppingBag} color="bg-blue-500"
          value={data?.stats?.totalOrders || 0} />
        <StatCard label="Total Customers" icon={Users} color="bg-emerald-500"
          value={data?.stats?.totalUsers || 0} />
        <StatCard label="Active Products" icon={Package} color="bg-purple-500"
          value={data?.stats?.totalProducts || 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Revenue (last 14 days) */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" /> Revenue — Last 14 Days
          </h2>
          {dailyRevenue.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {dailyRevenue.map(([day, rev]) => (
                <SimpleBar key={day}
                  label={new Date(day).toLocaleDateString('en-IN', { month:'short', day:'numeric' })}
                  value={`₹${Number(rev).toLocaleString('en-IN')}`}
                  max={maxRevDay}
                  color="bg-gradient-to-r from-primary-500 to-primary-400" />
              ))}
            </div>
          )}
        </div>

        {/* Top selling products */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Top Selling Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-dark-700" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                    <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-1.5 mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(((p.sold_count||0)/maxSold)*100)}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-amber-500" />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                    {p.sold_count || 0} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" /> Order Status Breakdown
          </h2>
          {statusCounts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {statusCounts.map(([status, count]) => {
                const colorMap = {
                  confirmed: 'bg-emerald-500', pending: 'bg-amber-500',
                  shipped: 'bg-blue-500', delivered: 'bg-primary-500',
                  cancelled: 'bg-red-500', processing: 'bg-purple-500',
                }
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorMap[status] || 'bg-gray-400'}`} />
                    <span className="flex-1 text-sm capitalize text-gray-700 dark:text-gray-300">{status}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent orders table */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-500" /> Recent Orders
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(data?.recentOrders || []).slice(0, 8).map(order => (
              <div key={order.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-800 text-sm">
                <div>
                  <p className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                    #{order.order_number}
                  </p>
                  <p className="text-gray-500 text-xs truncate max-w-[140px]">
                    {order.profiles?.full_name || order.profiles?.email || 'Customer'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                    order.status === 'confirmed' || order.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
            {!data?.recentOrders?.length && (
              <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
