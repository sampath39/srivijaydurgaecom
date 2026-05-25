import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Gift, Download, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

// Simple confetti-like animation without external dep
function launchConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: Math.random() * 6 + 4,
    d: Math.random() * 2 + 1,
    color: ['#F59E0B','#4F46E5','#DC2626','#10B981','#6366F1'][Math.floor(Math.random()*5)],
    tilt: Math.random() * 10 - 5,
    tiltAngle: 0,
  }))
  let frame = 0
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.tiltAngle += 0.05
      p.y += p.d
      p.x += Math.sin(p.tiltAngle) * 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI)
      ctx.fillStyle = p.color
      ctx.fill()
    })
    frame++
    if (frame < 200) requestAnimationFrame(animate)
    else canvas.remove()
  }
  animate()
}

export default function PaymentSuccessPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const launched  = useRef(false)

  const order_number  = state?.order_number  || 'SVD-ORDER'
  const order_id      = state?.order_id      || ''
  const total_amount  = state?.total_amount  || 0
  const points_earned = state?.points_earned || 0

  useEffect(() => {
    if (!launched.current) { launchConfetti(); launched.current = true }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center px-4 py-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-28 h-28 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Order Placed! 🎉
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
            Thank you for your purchase! Your order has been confirmed.
          </p>
        </motion.div>

        {/* Order details card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-6 mb-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Order Number</p>
              <p className="font-bold text-lg text-primary-600 font-mono">{order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Amount Paid</p>
              <p className="font-bold text-xl text-gray-900 dark:text-white">₹{Number(total_amount).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary-500" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Estimated Delivery</p>
                <p className="text-gray-500 text-sm">5–7 business days</p>
              </div>
            </div>
          </div>

          {points_earned > 0 && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-800">
              <Gift className="w-5 h-5 text-primary-500" />
              <div>
                <p className="font-semibold text-primary-700 dark:text-primary-400 text-sm">
                  🏆 You earned {points_earned} reward points!
                </p>
                <p className="text-primary-600/70 text-xs">Points added to your account</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3">
          {order_id && (
            <Link to={`/orders/${order_id}`}
              className="btn-primary flex-1 justify-center py-3.5">
              <Package className="w-4 h-4" /> Track Order
            </Link>
          )}
          <Link to="/orders" className="btn-secondary flex-1 justify-center py-3.5">
            View All Orders
          </Link>
          <Link to="/" className="btn-outline flex-1 justify-center py-3.5">
            Continue Shopping
          </Link>
        </motion.div>

        <p className="text-sm text-gray-400 mt-6">
          📧 Order confirmation sent to your email
        </p>
      </motion.div>
    </div>
  )
}
