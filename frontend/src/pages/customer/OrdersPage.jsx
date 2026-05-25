import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle } from 'lucide-react'
import api from '../../lib/axios'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',      color: 'badge-gray',  icon: Clock },
  confirmed:  { label: 'Confirmed',    color: 'badge-blue',  icon: CheckCircle },
  processing: { label: 'Processing',   color: 'badge-blue',  icon: Package },
  shipped:    { label: 'Shipped',      color: 'badge-gold',  icon: Truck },
  delivered:  { label: 'Delivered',    color: 'badge-green', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',    color: 'badge-red',   icon: XCircle },
  refunded:   { label: 'Refunded',     color: 'badge-gray',  icon: AlertCircle },
}

const TRACKING_STEPS = ['pending','confirmed','processing','shipped','delivered']

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then(({ data }) => { setOrders(data.data || []); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="page-container py-10 space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  )

  if (orders.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center page-container">
      <Package className="w-20 h-20 text-gray-200 dark:text-dark-600 mx-auto mb-5" />
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">No Orders Yet</h2>
      <p className="text-gray-500 mb-6">Looks like you haven't placed any orders!</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order, index) => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
          const StatusIcon = cfg.icon
          const stepIdx = TRACKING_STEPS.indexOf(order.status)

          return (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Link to={`/orders/${order.id}`} className="card p-5 block hover:shadow-premium transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-mono font-bold text-primary-600">{order.order_number}</p>
                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cfg.color}><StatusIcon className="w-3 h-3 inline mr-1" />{cfg.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Tracking bar */}
                {stepIdx >= 0 && order.status !== 'cancelled' && order.status !== 'refunded' && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      {TRACKING_STEPS.map((step, i) => (
                        <div key={step} className={`flex flex-col items-center flex-1 ${i <= stepIdx ? 'text-primary-500' : 'text-gray-300'}`}>
                          <div className={`w-3 h-3 rounded-full mb-1 ${i <= stepIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />
                          <span className="text-[9px] capitalize hidden sm:block">{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative h-1 bg-gray-200 dark:bg-dark-600 rounded-full mt-1">
                      <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${((stepIdx) / (TRACKING_STEPS.length - 1)) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(order.order_items || []).slice(0, 3).map((item, i) => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 overflow-hidden border border-gray-200 dark:border-dark-600">
                        <img src={item.products?.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {(order.order_items?.length || 0) > 3 && (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-xs text-gray-500">
                        +{(order.order_items?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{order.order_items?.length || 0} items</p>
                    <p className="font-bold text-gray-900 dark:text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
