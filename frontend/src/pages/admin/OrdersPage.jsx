import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Search, Edit, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled']
const STATUS_COLORS  = { pending:'badge-yellow', confirmed:'badge-blue', processing:'badge-purple', shipped:'badge-gold', delivered:'badge-green', cancelled:'badge-red' }

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('')
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/orders/admin/all?page=${page}&limit=${LIMIT}&status=${filter}&search=${search}`)
      setOrders(data.data || [])
      setTotal(data.count || 0)
    } catch { toast.error('Failed to load orders') }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter])

  const updateStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status })
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status } : x))
    toast.success(`Order updated to ${status}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-400 text-sm">{total} total orders</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key==='Enter' && load()}
            placeholder="Order # or customer..." className="input pl-10 py-2.5 text-sm w-64" />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input py-2.5 text-sm">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>{['Order #','Customer','Date','Items','Amount','Status','Action'].map(h=>(
                <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {loading ? Array(8).fill(0).map((_,i)=>(
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-10 rounded" /></td></tr>
              )) : orders.map(order => (
                <motion.tr key={order.id} initial={{opacity:0}} animate={{opacity:1}}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary-600 text-xs">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{order.profiles?.full_name || 'Guest'}</p>
                    <p className="text-xs text-gray-400">{order.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.order_items?.length || 0}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <select value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 cursor-pointer capitalize focus:ring-1 focus:ring-primary-500 ${STATUS_COLORS[order.status]||'bg-gray-100 text-gray-600'}`}>
                      {STATUS_OPTIONS.map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/orders/${order.id}`} target="_blank" rel="noreferrer"
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex">
                      <Eye className="w-4 h-4" />
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-700">
            <p className="text-xs text-gray-400">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page>=Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
