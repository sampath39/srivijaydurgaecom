import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, ShoppingBag, Users, DollarSign, Package, TrendingUp, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../../lib/axios'

const STATUS_COLORS = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-purple-100 text-purple-700', shipped:'bg-orange-100 text-orange-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingAlert, setSendingAlert] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState('🔥 Price dropped from ₹5999 → ₹4499. Sale offers available only 9 hours! Click here to grab your Kadi Saree now: http://localhost:3000')
  const [usersList, setUsersList] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleResetRevenue = async () => {
    if (!window.confirm("WARNING: This will completely delete ALL orders, POS invoices, and reset the revenue to zero. This action CANNOT be undone. Are you absolutely sure?")) return
    
    setResetting(true)
    try {
      const { data } = await api.delete('/admin/revenue/reset')
      if (data.success) {
        import('react-hot-toast').then(({ default: toast }) => toast.success(data.message))
        // Reload dashboard stats
        const { data: d } = await api.get('/admin/dashboard')
        setData(d)
      }
    } catch (err) {
      import('react-hot-toast').then(({ default: toast }) => toast.error(err.response?.data?.message || 'Failed to reset revenue'))
    } finally {
      setResetting(false)
    }
  }

  const handleApplySpecialDiscount = async () => {
    if (!selectedUserId) {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Please select a customer'))
      return
    }
    const percentNum = Number(discountPercent)
    if (discountPercent === '' || isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Please enter a valid percentage between 0 and 100'))
      return
    }
    setDiscountLoading(true)
    try {
      const foundUser = usersList.find(u => u.id === selectedUserId)
      await api.put(`/admin/users/${selectedUserId}/special-discount`, {
        special_discount: percentNum
      })
      
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(`Custom discount of ${percentNum}% applied to ${foundUser?.full_name || foundUser?.email}!`)
      })
      
      // Update local state to reflect the updated discount in the dropdown list
      setUsersList(prev => prev.map(u => u.id === selectedUserId ? { ...u, special_discount: percentNum } : u))
      setDiscountPercent('')
    } catch (err) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(err.response?.data?.message || err.message || 'Failed to apply discount')
      })
    } finally {
      setDiscountLoading(false)
    }
  }

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data: d }) => { setData(d); setLoading(false) })
      .catch(err => { 
        console.error(err)
        import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to load dashboard'))
        setLoading(false) 
      })

    api.get('/admin/users?limit=1000')
      .then(({ data: res }) => {
        setUsersList(res.data || [])
      })
      .catch(err => console.error('Failed to load users for dropdown:', err))
  }, [])

  const handleSendAlert = async () => {
    if (!window.confirm("Send Flash Sale WhatsApp alert to ALL customers? This will use your Twilio balance.")) return
    setSendingAlert(true)
    try {
      const { data } = await api.post('/admin/whatsapp/send', {
        recipientType: 'all',
        mode: 'custom',
        body: whatsappMessage
      })
      if (data.success) {
        import('react-hot-toast').then(({ default: toast }) => {
          toast.success(`Sent to ${data.summary.sent} users. Failed: ${data.summary.failed}`)
        })
      }
    } catch (err) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(err.response?.data?.message || err.message || 'Failed to send alerts')
      })
    } finally {
      setSendingAlert(false)
    }
  }

  // Build chart data from revenueData
  const chartData = (() => {
    if (!data?.revenueData) return []
    const byDay = {}
    data.revenueData.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString('en-IN', { month:'short', day:'numeric' })
      if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 }
      byDay[day].revenue += Number(o.total_amount)
      byDay[day].orders += 1
    })
    return Object.entries(byDay).slice(-14).map(([date, vals]) => ({ date, revenue: Math.round(vals.revenue), orders: vals.orders }))
  })()

  const STATS = data ? [
    { label:'Total Revenue', value:`₹${Number(data.stats.totalRevenue).toLocaleString('en-IN')}`, icon:DollarSign, color:'text-green-600', bg:'bg-green-50 dark:bg-green-900/20', change:'+12%' },
    { label:'Total Orders',  value:data.stats.totalOrders, icon:ShoppingBag, color:'text-blue-600', bg:'bg-blue-50 dark:bg-blue-900/20', change:'+8%' },
    { label:'Products',      value:data.stats.totalProducts, icon:Package, color:'text-primary-600', bg:'bg-primary-50 dark:bg-primary-900/20', change:'+3' },
    { label:'Customers',     value:data.stats.totalUsers, icon:Users, color:'text-purple-600', bg:'bg-purple-50 dark:bg-purple-900/20', change:'+24' },
  ] : []

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">srivijaydurgakadhiemporeum — Overview</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <button 
            onClick={handleResetRevenue}
            disabled={resetting}
            className="btn-secondary border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 text-sm"
          >
            {resetting ? 'Resetting...' : '🚨 Reset Revenue'}
          </button>
          <div>
            <p className="text-xs text-gray-400">Last 30 days</p>
            <p className="text-sm font-medium text-primary-600">{new Date().toLocaleDateString('en-IN', { month:'long', year:'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="font-display text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6 border-primary-500/30 bg-primary-50 dark:bg-primary-900/10">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          ⚡ Quick Actions: WhatsApp Alerts
        </h2>
        <div className="flex flex-col gap-3 max-w-2xl">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Content</label>
          <textarea
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            className="input resize-none h-24"
            placeholder="Type your WhatsApp message here..."
          />
          <button 
            onClick={handleSendAlert} 
            disabled={sendingAlert || !whatsappMessage.trim()}
            className="btn-primary text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)] self-start mt-2"
          >
            {sendingAlert ? 'Sending...' : '📱 Send WhatsApp Alert (All Users)'}
          </button>
        </div>
      </div>

      {/* Special User Discount Manager */}
      <div className="card p-6 border-secondary-500/30 bg-secondary-50 dark:bg-secondary-900/10">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          🎁 Quick Actions: Custom Customer Discount
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Customer</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input text-sm"
            >
              <option value="">-- Choose Customer --</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || 'No Name'} ({u.email}) {u.special_discount > 0 ? `[Current: ${u.special_discount}%]` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="input text-sm"
              placeholder="e.g. 15"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleApplySpecialDiscount} 
              disabled={discountLoading || !selectedUserId || discountPercent === ''}
              className="btn-primary w-full text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              {discountLoading ? 'Applying...' : 'Apply Special Discount'}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Charts */}
      {chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" /> Revenue Trend (14 Days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" dark:stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} cursor={{fill: 'rgba(245, 158, 11, 0.1)'}} />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" /> Order Volume (14 Days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" dark:stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip formatter={v => [v, 'Orders']} />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory Forecasting Alerts */}
      <div className="card p-6 border-red-500/30 bg-red-50 dark:bg-red-900/10">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-red-500 animate-pulse" /> Inventory Forecasting Alerts
        </h2>
        <div className="space-y-3">
          {(data?.topProducts || []).filter(p => p.stock_count <= 10).length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">All top-selling products have healthy inventory levels.</p>
          ) : (
            (data?.topProducts || []).filter(p => p.stock_count <= 10).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white dark:bg-dark-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={p.images?.[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-xs">{p.name}</p>
                    <p className="text-xs text-red-600 font-medium">Critical Stock: Only {p.stock_count} units left!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Sales Velocity</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{p.sold_count} sold recently</p>
                  <p className="text-xs text-red-500 mt-0.5">Est. out of stock in {(p.stock_count / Math.max(1, p.sold_count / 14)).toFixed(0)} days</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-primary-600 text-xs hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentOrders || []).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 last:border-0">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{order.profiles?.full_name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[order.status]||'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary-500" /> Top Products
            </h2>
            <Link to="/admin/products" className="text-primary-600 text-xs hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.topProducts || []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img src={p.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold_count} sold</p>
                </div>
                <p className="font-bold text-primary-600 text-sm shrink-0">₹{Number(p.discount_price||p.price).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
