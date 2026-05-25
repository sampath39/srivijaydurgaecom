import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCcw, ShoppingCart, CreditCard, AlertCircle, MapPin, Package } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function PaymentFailurePage() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const [retrying, setRetrying] = useState(false)

  const order_id    = state?.order_id    || ''
  const order_number= state?.order_number|| ''
  const total_amount= state?.total_amount|| 0
  const address     = state?.address     || null
  const items       = state?.items       || []
  const error       = state?.error       || 'Payment was not completed'

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const handleRetry = async () => {
    if (!order_id) { navigate('/cart'); return }
    setRetrying(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Payment gateway not available'); setRetrying(false); return }

      const { data } = await api.post(`/payments/retry/${order_id}`)

      const options = {
        key:      data.key_id,
        amount:   data.amount,
        currency: data.currency,
        name:     'Sri Vijaya Durga Kadi Emporium',
        description: `Retry Order ${data.order_number}`,
        order_id: data.razorpay_order_id,
        prefill:  data.prefill,
        theme:    { color: '#F59E0B' },
        modal:    { ondismiss: () => setRetrying(false) },

        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              order_id:            data.order_id,
            })
            navigate('/orders/success', {
              state: {
                order_number:  data.order_number,
                order_id:      data.order_id,
                total_amount:  data.total_amount,
                points_earned: verifyData.points_earned,
              }
            })
          } catch (e) {
            toast.error('Verification failed. Contact support.')
          }
          setRetrying(false)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => { toast.error('Payment failed again. Try a different method.'); setRetrying(false) })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry payment')
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center px-4 py-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-14 h-14 text-accent-500" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h1>
          <p className="text-gray-500 dark:text-gray-400">Don't worry — your cart is saved and your order is pending.</p>
        </div>

        {/* Error reason */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-4 mb-4 flex items-start gap-3 border-l-4 border-accent-500">
          <AlertCircle className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">What went wrong?</p>
            <p className="text-gray-500 text-sm mt-0.5">{error}</p>
          </div>
        </motion.div>

        {/* Stored order details */}
        {(order_number || address || items.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="card p-5 mb-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Your Order Details (Saved)</h3>

            {order_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Order #</span>
                <span className="font-mono font-bold text-primary-600">{order_number}</span>
              </div>
            )}

            {total_amount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{Number(total_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{address.full_name} · {address.phone}</p>
                  <p className="text-gray-500">{address.address_line1}, {address.city}, {address.state} - {address.pincode}</p>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{items.length} item(s)</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-6 h-6 rounded bg-gray-100 overflow-hidden shrink-0">
                        <img src={item.product?.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate flex-1">{item.product?.name}</span>
                      <span>×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-3">
          <button onClick={handleRetry} disabled={retrying}
            className="btn-primary w-full justify-center py-4 text-base">
            {retrying ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Retrying Payment...
              </div>
            ) : (
              <><RefreshCcw className="w-5 h-5" /> Retry Payment</>
            )}
          </button>

          <Link to="/cart" className="btn-outline w-full justify-center py-3.5">
            <ShoppingCart className="w-4 h-4" /> Back to Cart
          </Link>

          <Link to="/checkout" className="btn-ghost w-full justify-center py-3 text-sm">
            <CreditCard className="w-4 h-4" /> Change Payment Method
          </Link>
        </motion.div>

        <div className="mt-6 text-center space-y-1">
          <p className="text-sm text-gray-400">💡 Your cart items are preserved</p>
          <p className="text-sm text-gray-400">📞 Need help? Call <a href="tel:9493447776" className="text-primary-500 hover:underline">9493447776</a></p>
        </div>
      </motion.div>
    </div>
  )
}
