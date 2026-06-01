import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCcw, ShoppingCart, CreditCard, AlertCircle, MapPin, Package } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function PaymentFailurePage() {
  const { state }  = useLocation()
  const navigate   = useNavigate()

  const total_amount= state?.total_amount|| 0
  const address     = state?.address     || null
  const items       = state?.items       || []
  const error       = state?.error       || 'Payment was not completed'

  const handleRecheckout = () => {
    navigate('/checkout')
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
          <p className="text-gray-500 dark:text-gray-400">Don't worry — your cart items are safe. You can retry checkout anytime.</p>
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

        {/* Checkout details */}
        {(address || items.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="card p-5 mb-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Your Checkout Details</h3>

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
          <button onClick={handleRecheckout}
            className="btn-primary w-full justify-center py-4 text-base">
            <RefreshCcw className="w-5 h-5 animate-pulse" /> Try Payment Again / Re-checkout
          </button>

          <Link to="/cart" className="btn-outline w-full justify-center py-3.5">
            <ShoppingCart className="w-4 h-4" /> Back to Cart
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
