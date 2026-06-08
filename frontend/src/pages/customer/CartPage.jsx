import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { removeFromCart, updateQuantity, selectCartItems, selectCartTotal } from '../../store/slices/cartSlice'
import { setProfile } from '../../store/slices/authSlice'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function CartPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const items     = useSelector(selectCartItems)
  const subtotal  = useSelector(selectCartTotal)
  const profile   = useSelector(s => s.auth.profile)
  const [coupon, setCoupon]     = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponErr, setCouponErr]   = useState('')
  const [applying, setApplying]     = useState(false)

  const shipping        = subtotal > 999 ? 0 : 50
  const discount        = couponData?.discount || 0
  const specialDiscount = profile?.special_discount > 0
    ? Math.round((subtotal * profile.special_discount) / 100) : 0
  const total           = subtotal - discount - specialDiscount + shipping

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setApplying(true)
    setCouponErr('')
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, cart_total: subtotal })
      if (data.success) {
        setCouponData(data)
        toast.success(`Coupon applied! You save ₹${data.discount} 🎉`)
      }
    } catch (err) {
      setCouponErr(err.response?.data?.message || 'Invalid coupon')
      setCouponData(null)
    }
    setApplying(false)
  }

  const removeCoupon = () => { setCouponData(null); setCoupon(''); setCouponErr('') }

  // Fetch fresh profile on cart load so admin-applied special_discount shows immediately
  useEffect(() => {
    api.get('/auth/profile').then(({ data }) => {
      if (data?.data) dispatch(setProfile(data.data))
    }).catch(() => {})
  }, [])

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center page-container py-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <ShoppingBag className="w-24 h-24 text-gray-200 dark:text-dark-600 mx-auto mb-6" />
        <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-3">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 text-lg">Looks like you haven't added anything yet!</p>
        <Link to="/products" className="btn-primary px-10 py-4 text-lg">Start Shopping</Link>
      </motion.div>
    </div>
  )

  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-8">Shopping Cart <span className="text-primary-500">({items.length} items)</span></h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <motion.div key={`${item.product.id}-${item.size}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 flex gap-4"
            >
              <Link to={`/products/${item.product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <img src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=200'}
                  alt={item.product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.slug}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-2">
                  {item.product.name}
                </Link>
                {item.size && <p className="text-sm text-gray-500 mt-0.5">Size: {item.size}</p>}
                <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                  <div className="flex items-center gap-2 border border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden">
                    <button onClick={() => dispatch(updateQuantity({ productId: item.product.id, size: item.size, quantity: item.quantity - 1 }))}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => dispatch(updateQuantity({ productId: item.product.id, size: item.size, quantity: item.quantity + 1 }))}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary-600 text-lg">
                      ₹{((item.product.discount_price || item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <button onClick={() => dispatch(removeFromCart({ productId: item.product.id, size: item.size }))}
                      className="text-gray-400 hover:text-accent-600 transition-colors p-1.5 hover:bg-accent-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <Link to="/products" className="btn-ghost py-3 px-6 text-sm inline-flex items-center gap-2">
            ← Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-6">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-6">
              <label className="label">Have a Coupon?</label>
              {couponData ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 text-sm font-medium flex-1">{couponData.coupon.code} — Save ₹{discount}!</span>
                  <button onClick={removeCoupon}><X className="w-4 h-4 text-green-600" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE" className="input py-2 text-sm uppercase font-mono flex-1" />
                  <button onClick={applyCoupon} disabled={applying}
                    className="btn-outline py-2 px-4 text-sm whitespace-nowrap">{applying ? '...' : 'Apply'}</button>
                </div>
              )}
              {couponErr && <p className="text-accent-500 text-xs mt-1">{couponErr}</p>}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({items.reduce((s,i) => s+i.quantity, 0)} items)</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {specialDiscount > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Special Discount ({profile.special_discount}%)</span>
                  <span>-₹{specialDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-900 dark:text-white'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-primary-600">Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping!</p>
              )}
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                  <span className="font-bold text-primary-600 text-xl">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/checkout', { state: { couponData } })}
              className="btn-primary w-full justify-center py-4 text-base mt-6">
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Secure checkout</span>
              <span>🛡️ 100% safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
