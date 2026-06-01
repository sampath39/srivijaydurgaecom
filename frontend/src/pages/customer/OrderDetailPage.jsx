import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, MapPin, CreditCard, ArrowLeft, Truck } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const STATUS_STEPS = [
  { key:'pending',    icon:'🕐', label:'Order Placed' },
  { key:'confirmed',  icon:'✅', label:'Confirmed' },
  { key:'processing', icon:'📦', label:'Packing' },
  { key:'shipped',    icon:'🚚', label:'Shipped' },
  { key:'delivered',  icon:'🏠', label:'Delivered' },
]

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancel] = useState(false)

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => { setOrder(data.data); setLoading(false) })
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return
    setCancel(true)
    await api.post(`/orders/${id}/cancel`)
    setOrder(o => ({...o, status: 'cancelled'}))
    setCancel(false)
  }



  if (loading) return <div className="page-container py-10"><div className="skeleton h-96 rounded-2xl" /></div>
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  const stepIdx = STATUS_STEPS.findIndex(s => s.key === order.status)
  const addr = order.address_snapshot || order.addresses

  return (
    <div className="page-container py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/orders" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="section-title text-2xl">Order Details</h1>
          <p className="font-mono text-primary-600 font-bold">{order.order_number}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking */}
          {order.status !== 'cancelled' && order.status !== 'refunded' && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-500" /> Order Tracking
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-600" />
                <div className="absolute left-4 top-0 w-0.5 bg-primary-500 transition-all duration-1000"
                  style={{ height: stepIdx >= 0 ? `${(stepIdx / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }} />
                <div className="space-y-6">
                  {STATUS_STEPS.map((step, i) => (
                    <motion.div key={step.key}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className={`relative pl-12 ${i <= stepIdx ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 z-10 ${
                        i <= stepIdx ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600'
                      }`}>
                        {i < stepIdx ? '✓' : step.icon}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${i <= stepIdx ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                        {i === stepIdx && (
                          <p className="text-xs text-primary-600 mt-0.5">Current status</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" /> Order Items
            </h2>
            <div className="space-y-4">
              {(order.order_items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-dark-700 overflow-hidden shrink-0">
                    <img src={item.product_snapshot?.image || item.products?.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.product_snapshot?.name || item.products?.name}</p>
                    {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-primary-600">₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Payment summary */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary-500" /> Payment Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount_amount}</span></div>}
              {order.points_value > 0 && <div className="flex justify-between text-secondary-600"><span>Points Used</span><span>-₹{order.points_value}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping_charge > 0 ? `₹${order.shipping_charge}` : 'Free'}</span></div>
              <div className="border-t border-gray-100 dark:border-dark-700 pt-2 flex justify-between font-bold">
                <span>Total</span><span className="text-primary-600">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Payment</span><span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Status</span>
                <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : 'text-accent-600 font-medium'}>
                  {order.payment_status}
                </span>
              </div>
              {order.payment_method === 'razorpay' && order.payment_status !== 'paid' && !['cancelled', 'refunded'].includes(order.status) && (
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full mt-4 btn-primary py-2.5 text-sm justify-center flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Again (Re-checkout)
                </button>
              )}
            </div>
          </div>

          {/* Delivery address */}
          {addr && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" /> Delivery Address
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                <p>{addr.phone}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>{addr.country}</p>
              </div>
            </div>
          )}

          {/* Cancel button */}
          {['pending','confirmed'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn-danger w-full justify-center py-3 text-sm">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
