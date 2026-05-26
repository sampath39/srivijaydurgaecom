import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, CreditCard, Tag, Gift, CheckCircle, ChevronDown, ChevronUp, Trash2, Truck, AlertCircle, Loader2 } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ── Validation helpers ────────────────────────────────────────
const INDIAN_PHONE = /^[6-9]\d{9}$/
const PINCODE_RE   = /^\d{6}$/

function validateAddrForm(form) {
  const errs = {}
  if (!form.full_name.trim() || form.full_name.trim().length < 3)
    errs.full_name = 'Enter a valid full name (min 3 characters)'
  if (!INDIAN_PHONE.test(form.phone.replace(/\s+/g, '')))
    errs.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6–9)'
  if (!form.address_line1.trim() || form.address_line1.trim().length < 5)
    errs.address_line1 = 'Enter a complete address (min 5 characters)'
  if (!form.city.trim())
    errs.city = 'City is required'
  if (!form.state.trim())
    errs.state = 'State is required'
  if (!PINCODE_RE.test(form.pincode.trim()))
    errs.pincode = 'Enter a valid 6-digit pincode'
  return errs
}

const EMPTY_FORM = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', country: 'India',
}

export default function CheckoutPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const dispatch  = useDispatch()
  const items     = useSelector(selectCartItems)
  const subtotal  = useSelector(selectCartTotal)
  const profile   = useSelector(s => s.auth.profile)

  const [addresses, setAddresses]       = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [showNewAddr, setShowNewAddr]   = useState(false)
  const [addrForm, setAddrForm]         = useState(EMPTY_FORM)
  const [addrErrors, setAddrErrors]     = useState({})
  const [savingAddr, setSavingAddr]     = useState(false)
  const [deletingId, setDeletingId]     = useState(null)

  const [coupon, setCoupon]         = useState('')
  const [couponData, setCouponData] = useState(location.state?.couponData || null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [pointsToUse, setPointsToUse]    = useState(0)
  const [payLoading, setPayLoading]      = useState(false)

  const specialDiscount = profile?.special_discount > 0 ? Math.round((subtotal * profile.special_discount) / 100) : 0
  const discount  = couponData?.discount || 0
  const pointsVal = pointsToUse * 0.1
  const shipping  = subtotal > 999 ? 0 : 50
  const total     = Math.max(0, subtotal - discount - pointsVal - specialDiscount + shipping)
  const maxPoints = Math.min(profile?.reward_points || 0, (subtotal - discount - specialDiscount) * 10)

  // ── Load saved addresses ─────────────────────────────────────
  useEffect(() => {
    api.get('/addresses')
      .then(({ data }) => {
        const list = data.data || []
        setAddresses(list)
        const def = list.find(a => a.is_default) || list[0]
        if (def) setSelectedAddr(def)
        if (list.length === 0) setShowNewAddr(true) // open form if no addresses
      })
      .catch(() => {
        toast.error('Could not load addresses. Check your connection.')
        setShowNewAddr(true)
      })
  }, [])

  // ── Save / validate new address ──────────────────────────────
  const saveAddress = async () => {
    const errs = validateAddrForm(addrForm)
    if (Object.keys(errs).length > 0) {
      setAddrErrors(errs)
      toast.error('Please fix the highlighted fields')
      return
    }
    setAddrErrors({})
    setSavingAddr(true)
    try {
      const payload = { ...addrForm, is_default: addresses.length === 0 }
      const { data } = await api.post('/addresses', payload)
      const saved = data.data
      setAddresses(a => [...a, saved])
      setSelectedAddr(saved)
      setAddrForm(EMPTY_FORM)
      setShowNewAddr(false)
      toast.success('Address saved successfully! ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address. Try again.')
    } finally {
      setSavingAddr(false)
    }
  }

  const deleteAddress = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/addresses/${id}`)
      const updated = addresses.filter(a => a.id !== id)
      setAddresses(updated)
      if (selectedAddr?.id === id) setSelectedAddr(updated[0] || null)
      toast.success('Address removed')
    } catch {
      toast.error('Could not delete address')
    } finally {
      setDeletingId(null)
    }
  }

  const applyCoupon = async () => {
    if (!coupon.trim()) { toast.error('Enter a coupon code'); return }
    setCouponLoading(true)
    try {
      const { data } = await api.post('/coupons/validate', {
        code: coupon.toUpperCase(),
        order_amount: subtotal,
      })
      setCouponData(data)
      toast.success(`Coupon applied! You save ₹${data.discount}`)
    } catch (err) {
      setCouponData(null)
      toast.error(err.response?.data?.message || 'Invalid or expired coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  // ── Razorpay payment ─────────────────────────────────────────
  const loadRazorpayScript = () => new Promise(resolve => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const s = document.createElement('script')
    s.id = 'rzp-script'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const handlePayment = async () => {
    if (!selectedAddr) { toast.error('Please select a delivery address'); return }
    if (items.length === 0) { toast.error('Your cart is empty'); return }

    setPayLoading(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) { toast.error('Failed to load Razorpay. Check your internet connection.'); return }

      const cartPayload = items.map(i => ({
        product_id: i.product.id,
        quantity:   i.quantity,
        size:       i.size,
      }))

      const { data: orderData } = await api.post('/payments/create-order', {
        cart_items:    cartPayload,
        address_id:    selectedAddr.id,
        coupon_code:   couponData?.coupon?.code || '',
        points_to_use: pointsToUse,
      })

      const options = {
        key:      orderData.key_id,
        amount:   orderData.amount,
        currency: orderData.currency,
        name:     'srivijaydurgakadhiemporeum',
        description: 'Store Checkout Payment',
        order_id: orderData.razorpay_order_id,
        prefill:  orderData.prefill,
        theme:    { color: '#F59E0B' },
        modal:    { ondismiss: () => { setPayLoading(false); toast('Payment cancelled') } },

        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              cart_items:    cartPayload,
              address_id:    selectedAddr.id,
              coupon_code:   couponData?.coupon?.code || '',
              points_to_use: pointsToUse,
            })
            dispatch(clearCart())
            navigate('/orders/success', {
              state: {
                order_number:  verifyData.order_number,
                order_id:      verifyData.order_id,
                total_amount:  orderData.total_amount,
                points_earned: verifyData.points_earned,
              },
            })
          } catch {
            toast.error('Payment verification failed. Please contact support.')
          }
          setPayLoading(false)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error.description}`)
        setPayLoading(false)
      })

      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment. Please try again.')
      setPayLoading(false)
    }
  }

  // ── Field change helper ──────────────────────────────────────
  const setField = (key, val) => {
    setAddrForm(f => ({ ...f, [key]: val }))
    if (addrErrors[key]) setAddrErrors(e => ({ ...e, [key]: '' }))
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left column ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Delivery Address card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" /> Delivery Address
              </h2>
              <button onClick={() => { setShowNewAddr(!showNewAddr); setAddrErrors({}) }}
                className="btn-ghost text-sm gap-1.5">
                <Plus className="w-4 h-4" /> {showNewAddr ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Saved address list */}
            <div className="space-y-3 mb-4">
              {addresses.map(addr => (
                <div key={addr.id}
                  onClick={() => setSelectedAddr(addr)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddr?.id === addr.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600 hover:border-primary-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedAddr?.id === addr.id ? 'border-primary-500' : 'border-gray-300'}`}>
                        {selectedAddr?.id === addr.id && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {addr.is_default && <span className="badge-gold text-xs">Default</span>}
                      <button
                        onClick={e => { e.stopPropagation(); deleteAddress(addr.id) }}
                        disabled={deletingId === addr.id}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
                        title="Delete address"
                      >
                        {deletingId === addr.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {addresses.length === 0 && !showNewAddr && (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No addresses saved. Add one below.</p>
                </div>
              )}
            </div>

            {/* ── New address form ─────────────────────── */}
            <AnimatePresence>
              {showNewAddr && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100 dark:border-dark-700 pt-5"
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New Delivery Address</p>
                  <div className="grid grid-cols-2 gap-4">

                    {/* Full Name */}
                    <div>
                      <label className="label">Full Name *</label>
                      <input
                        value={addrForm.full_name}
                        onChange={e => setField('full_name', e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className={`input text-sm ${addrErrors.full_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      {addrErrors.full_name && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.full_name}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="label">Mobile Number *</label>
                      <input
                        value={addrForm.phone}
                        onChange={e => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile (e.g. 9876543210)"
                        maxLength={10}
                        inputMode="numeric"
                        className={`input text-sm ${addrErrors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      {addrErrors.phone && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Address Line 1 */}
                    <div className="col-span-2">
                      <label className="label">House / Flat / Block No. *</label>
                      <input
                        value={addrForm.address_line1}
                        onChange={e => setField('address_line1', e.target.value)}
                        placeholder="e.g. #12-3, Sri Nivas Apartments"
                        className={`input text-sm ${addrErrors.address_line1 ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      {addrErrors.address_line1 && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.address_line1}
                        </p>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div className="col-span-2">
                      <label className="label">Area / Colony (optional)</label>
                      <input
                        value={addrForm.address_line2}
                        onChange={e => setField('address_line2', e.target.value)}
                        placeholder="e.g. Arundelpet, near Clock Tower"
                        className="input text-sm"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="label">City *</label>
                      <input
                        value={addrForm.city}
                        onChange={e => setField('city', e.target.value)}
                        placeholder="e.g. Guntur"
                        className={`input text-sm ${addrErrors.city ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      {addrErrors.city && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.city}
                        </p>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <label className="label">State *</label>
                      <select
                        value={addrForm.state}
                        onChange={e => setField('state', e.target.value)}
                        className={`input text-sm ${addrErrors.state ? 'border-red-400 focus:ring-red-400' : ''}`}
                      >
                        <option value="">Select state</option>
                        {['Andhra Pradesh','Telangana','Karnataka','Tamil Nadu','Maharashtra','Kerala','Gujarat','Rajasthan','Punjab','Haryana','Delhi','West Bengal','Uttar Pradesh','Madhya Pradesh','Bihar','Odisha','Assam','Uttarakhand','Himachal Pradesh','Jharkhand','Chhattisgarh','Goa','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura','Arunachal Pradesh','Other'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {addrErrors.state && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.state}
                        </p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="label">Pincode *</label>
                      <input
                        value={addrForm.pincode}
                        onChange={e => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        inputMode="numeric"
                        className={`input text-sm ${addrErrors.pincode ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      {addrErrors.pincode && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{addrErrors.pincode}
                        </p>
                      )}
                    </div>

                    {/* Country (fixed) */}
                    <div>
                      <label className="label">Country</label>
                      <input value="India" disabled className="input text-sm opacity-60 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={saveAddress}
                      disabled={savingAddr}
                      className="btn-primary py-2.5 px-6 gap-2"
                    >
                      {savingAddr
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                        : <><CheckCircle className="w-4 h-4" /> Save Address</>
                      }
                    </button>
                    <button
                      onClick={() => { setShowNewAddr(false); setAddrErrors({}) }}
                      className="btn-ghost py-2.5 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Coupon code */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-primary-500" /> Coupon Code
            </h2>
            {couponData ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    ✅ {couponData.coupon?.code} applied!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">You save ₹{discount}</p>
                </div>
                <button onClick={() => { setCouponData(null); setCoupon('') }}
                  className="text-sm text-red-500 hover:text-red-600 font-medium">Remove</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Enter coupon code"
                  className="input flex-1 text-sm uppercase tracking-widest"
                />
                <button onClick={applyCoupon} disabled={couponLoading}
                  className="btn-primary px-5 py-2.5 gap-2">
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Reward points */}
          {(profile?.reward_points || 0) > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-secondary-500" /> Use Reward Points
                <span className="badge-blue ml-2">{profile.reward_points} pts available</span>
              </h2>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={maxPoints} step={10} value={pointsToUse}
                  onChange={e => setPointsToUse(+e.target.value)}
                  className="flex-1 accent-secondary-500" />
                <div className="text-right min-w-16">
                  <p className="font-bold text-secondary-600">{pointsToUse} pts</p>
                  <p className="text-xs text-gray-400">= ₹{pointsVal.toFixed(2)} off</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">1 point = ₹0.10 discount</p>
            </div>
          )}

          {/* Cart items */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-500" /> Order Items ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={item.product.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product.name}</p>
                    {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">×{item.quantity}</p>
                    <p className="text-sm text-primary-600 font-bold">
                      ₹{((item.product.discount_price || item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Order summary (right) ─────────────────────── */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-5">Payment Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({couponData?.coupon?.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              {specialDiscount > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  <span>Special Customer Discount ({profile.special_discount}%)</span>
                  <span>-₹{specialDiscount}</span>
                </div>
              )}
              {pointsVal > 0 && (
                <div className="flex justify-between text-secondary-600">
                  <span>Points ({pointsToUse} pts)</span>
                  <span>-₹{pointsVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-900 dark:text-white'}>
                  {shipping === 0 ? 'FREE 🎉' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add ₹{1000 - subtotal} more for free shipping</p>
              )}
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                <span className="font-bold text-primary-600 text-xl">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {!selectedAddr && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Please add a delivery address to proceed
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={payLoading || !selectedAddr || items.length === 0}
              className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {payLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing…
                </span>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay ₹{total.toLocaleString('en-IN')}</>
              )}
            </button>

            <div className="mt-4 space-y-1.5 text-xs text-gray-400 text-center">
              <p>🔒 256-bit SSL encrypted payment</p>
              <p>Powered by Razorpay · UPI · Cards · Net Banking · Wallets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
