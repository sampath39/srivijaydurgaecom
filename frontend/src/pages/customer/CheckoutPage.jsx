import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, CreditCard, Tag, Gift, CheckCircle,
  Trash2, Truck, AlertCircle, Loader2, Banknote, Locate,
  ChevronRight, ShieldCheck
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ── Validation ────────────────────────────────────────────────
const INDIAN_PHONE = /^(?:\+91|0)?[6-9]\d{9}$/
const PINCODE_RE   = /^\d{6}$/

function validateAddrForm(form) {
  const errs = {}
  if (!form.full_name.trim() || form.full_name.trim().length < 3)
    errs.full_name = 'Enter a valid full name (min 3 characters)'
  const cleanedPhone = form.phone.replace(/[\s\-\(\)]/g, '')
  if (!INDIAN_PHONE.test(cleanedPhone))
    errs.phone = 'Enter a valid 10-digit Indian mobile number'
  if (!form.address_line1.trim() || form.address_line1.trim().length < 5)
    errs.address_line1 = 'Enter a complete address (min 5 characters)'
  if (!form.city.trim())  errs.city  = 'City is required'
  if (!form.state.trim()) errs.state = 'State is required'
  if (!PINCODE_RE.test(form.pincode.trim()))
    errs.pincode = 'Enter a valid 6-digit pincode'
  return errs
}

const EMPTY_FORM = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', country: 'India',
}

const INDIAN_STATES = [
  'Andhra Pradesh','Telangana','Karnataka','Tamil Nadu','Maharashtra','Kerala',
  'Gujarat','Rajasthan','Punjab','Haryana','Delhi','West Bengal','Uttar Pradesh',
  'Madhya Pradesh','Bihar','Odisha','Assam','Uttarakhand','Himachal Pradesh',
  'Jharkhand','Chhattisgarh','Goa','Manipur','Meghalaya','Mizoram','Nagaland',
  'Sikkim','Tripura','Arunachal Pradesh','Other'
]

// ── Shipping (mirrors backend logic) ─────────────────────────
function calcShipping(city, pincode, subtotal, payMethod) {
  if (payMethod !== 'cod') return subtotal > 999 ? 0 : 50
  const c = (city || '').toLowerCase().trim()
  const p = parseInt((pincode || '').replace(/\D/g, '') || '0', 10)
  if (c === 'guntur' || (p >= 522001 && p <= 522299)) return 0        // Guntur — FREE
  if (p >= 500000 && p <= 535999) return 40   // AP / Telangana
  if (p >= 560000 && p <= 641999) return 80   // South India
  if (p >= 400000 && p <= 431999) return 100  // Maharashtra / Goa
  return 150                                   // Rest of India
}

function shippingLabel(city, pincode, payMethod) {
  if (payMethod !== 'cod') return null
  const c = (city || '').toLowerCase().trim()
  const p = parseInt((pincode || '').replace(/\D/g, '') || '0', 10)
  if (c === 'guntur' || (p >= 522001 && p <= 522299)) return '🎉 FREE – Guntur local delivery'
  if (p >= 500000 && p <= 535999) return 'AP/Telangana zone'
  if (p >= 560000 && p <= 641999) return 'South India zone'
  if (p >= 400000 && p <= 431999) return 'Maharashtra zone'
  return 'Rest of India zone'
}

// ── Reverse geocode (OpenStreetMap, free) ─────────────────────
async function reverseGeocode(lat, lng) {
  const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  const a    = data.address || {}
  return {
    address_line1: [a.house_number, a.road, a.neighbourhood].filter(Boolean).join(', ') || a.suburb || '',
    address_line2: a.suburb || a.locality || '',
    city:    a.city || a.town || a.village || a.county || '',
    state:   a.state || '',
    pincode: a.postcode || '',
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const items    = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartTotal)
  const profile  = useSelector(s => s.auth.profile)

  // Address
  const [addresses, setAddresses]     = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [addrForm, setAddrForm]       = useState(EMPTY_FORM)
  const [addrErrors, setAddrErrors]   = useState({})
  const [savingAddr, setSavingAddr]   = useState(false)
  const [deletingId, setDeletingId]   = useState(null)
  const [locating, setLocating]       = useState(false)

  // Payment
  const [payMethod, setPayMethod]     = useState(null) // null = not chosen yet
  const [coupon, setCoupon]           = useState('')
  const [couponData, setCouponData]   = useState(location.state?.couponData || null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [payLoading, setPayLoading]   = useState(false)

  const specialDiscount = profile?.special_discount > 0
    ? Math.round((subtotal * profile.special_discount) / 100) : 0
  const discount  = couponData?.discount || 0
  const pointsVal = pointsToUse * 0.01
  const shipping  = selectedAddr
    ? calcShipping(selectedAddr.city, selectedAddr.pincode, subtotal, payMethod || 'online')
    : (subtotal > 999 ? 0 : 50)
  const total     = Math.max(0, subtotal - discount - pointsVal - specialDiscount + shipping)
  const maxPoints = Math.min(profile?.reward_points || 0, (subtotal - discount - specialDiscount) * 100)

  // Step logic
  const addrDone  = !!selectedAddr
  const payChosen = !!payMethod

  // ── Load saved addresses ───────────────────────────────────
  useEffect(() => {
    api.get('/addresses').then(({ data }) => {
      const list = data.data || []
      setAddresses(list)
      const def = list.find(a => a.is_default) || list[0]
      if (def) setSelectedAddr(def)
      if (list.length === 0) setShowNewAddr(true)
    }).catch(() => { toast.error('Could not load addresses.'); setShowNewAddr(true) })
  }, [])

  // ── Detect location ───────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const geo = await reverseGeocode(coords.latitude, coords.longitude)
        const matched = INDIAN_STATES.find(s => s.toLowerCase() === (geo.state || '').toLowerCase()) || ''
        setAddrForm(f => ({
          ...f,
          address_line1: geo.address_line1 || f.address_line1,
          address_line2: geo.address_line2 || f.address_line2,
          city: geo.city || f.city,
          state: matched || f.state,
          pincode: geo.pincode || f.pincode,
        }))
        setAddrErrors({})
        toast.success('Location detected! Please verify and complete the form.')
      } catch { toast.error('Could not get address from location.') }
      finally   { setLocating(false) }
    }, err => {
      setLocating(false)
      toast.error(err.code === 1 ? 'Location permission denied.' : 'Could not get location.')
    }, { timeout: 10000, enableHighAccuracy: true })
  }

  // ── Save address ──────────────────────────────────────────
  const saveAddress = async () => {
    const errs = validateAddrForm(addrForm)
    if (Object.keys(errs).length > 0) { setAddrErrors(errs); toast.error('Please fix highlighted fields'); return }
    setAddrErrors({})
    setSavingAddr(true)
    try {
      const { data } = await api.post('/addresses', { ...addrForm, is_default: addresses.length === 0 })
      const saved = data.data
      setAddresses(a => [...a, saved])
      setSelectedAddr(saved)
      setAddrForm(EMPTY_FORM)
      setShowNewAddr(false)
      toast.success('Address saved! ✅ Now select payment method.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address.')
    } finally { setSavingAddr(false) }
  }

  const deleteAddress = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/addresses/${id}`)
      const updated = addresses.filter(a => a.id !== id)
      setAddresses(updated)
      if (selectedAddr?.id === id) { setSelectedAddr(updated[0] || null); setPayMethod(null) }
      toast.success('Address removed')
    } catch { toast.error('Could not delete address') }
    finally { setDeletingId(null) }
  }

  const applyCoupon = async () => {
    if (!coupon.trim()) { toast.error('Enter a coupon code'); return }
    setCouponLoading(true)
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon.toUpperCase(), order_amount: subtotal })
      setCouponData(data)
      toast.success(`Coupon applied! You save ₹${data.discount}`)
    } catch (err) {
      setCouponData(null)
      toast.error(err.response?.data?.message || 'Invalid coupon')
    } finally { setCouponLoading(false) }
  }

  // ── COD handler ──────────────────────────────────────────
  const handleCOD = async () => {
    if (!selectedAddr || !payMethod) return
    setPayLoading(true)
    try {
      const cartPayload = items.map(i => ({ product_id: i.product.id, quantity: i.quantity, size: i.size }))
      const { data } = await api.post('/payments/cod', {
        cart_items: cartPayload, address_id: selectedAddr.id,
        coupon_code: couponData?.coupon?.code || '', points_to_use: pointsToUse,
      })
      dispatch(clearCart())
      navigate('/orders/success', { state: { order_number: data.order_number, order_id: data.order_id, total_amount: data.total_amount, points_earned: data.points_earned, is_cod: true } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place COD order.')
    } finally { setPayLoading(false) }
  }

  // ── Razorpay handler ─────────────────────────────────────
  const loadRazorpay = () => new Promise(resolve => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const s = document.createElement('script')
    s.id = 'rzp-script'; s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true); s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const handleOnlinePayment = async () => {
    if (!selectedAddr || !payMethod) return
    setPayLoading(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { toast.error('Failed to load Razorpay.'); setPayLoading(false); return }
      const cartPayload = items.map(i => ({ product_id: i.product.id, quantity: i.quantity, size: i.size }))
      const { data: orderData } = await api.post('/payments/create-order', {
        cart_items: cartPayload, address_id: selectedAddr.id,
        coupon_code: couponData?.coupon?.code || '', points_to_use: pointsToUse,
      })

      const handleFailure = async (errDescription) => {
        setPayLoading(false)
        try {
          await api.post('/payments/fail', { order_id: orderData.order_id })
        } catch (failErr) {
          console.error('Failed to mark order as failed:', failErr)
        }
        navigate('/orders/failure', {
          state: {
            order_id:     orderData.order_id,
            order_number: orderData.order_number,
            total_amount: orderData.total_amount,
            address:      selectedAddr,
            items:        items.map(i => ({
              product:  i.product,
              quantity: i.quantity,
              size:     i.size
            })),
            error:        errDescription || 'Payment was not completed'
          }
        })
      }

      if (orderData.razorpay_order_id && orderData.razorpay_order_id.startsWith('mock_')) {
        const simulateSuccess = confirm(
          "Razorpay is running in SIMULATION MODE (invalid keys on server).\n\n" +
          "Click OK to simulate SUCCESSFUL payment.\n" +
          "Click CANCEL to simulate FAILED payment."
        )
        if (simulateSuccess) {
          toast.success('Simulation Mode: Simulating payment success...', { duration: 3000 })
          setTimeout(async () => {
            try {
              const { data: v } = await api.post('/payments/verify', {
                razorpay_order_id:   orderData.razorpay_order_id,
                razorpay_payment_id: `mock_pay_${Date.now()}`,
                razorpay_signature:  `mock_sig_${Date.now()}`,
                order_id:            orderData.order_id,
              })
              dispatch(clearCart())
              navigate('/orders/success', { state: { order_number: v.order_number, order_id: v.order_id, total_amount: orderData.total_amount, points_earned: v.points_earned } })
            } catch (verifyErr) {
              handleFailure(verifyErr.response?.data?.message || 'Verification failed')
            }
          }, 1500)
        } else {
          handleFailure('Simulated payment failure/cancellation')
        }
        return
      }

      const options = {
        key: orderData.key_id, amount: orderData.amount, currency: orderData.currency,
        name: 'Sri Vijaya Durga Kadi Emporium', description: 'Order Payment',
        order_id: orderData.razorpay_order_id, prefill: orderData.prefill,
        theme: { color: '#F59E0B' },
        modal: { ondismiss: () => { handleFailure('Payment cancelled by user') } },
        handler: async (response) => {
          try {
            const { data: v } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              order_id:            orderData.order_id,
            })
            dispatch(clearCart())
            navigate('/orders/success', { state: { order_number: v.order_number, order_id: v.order_id, total_amount: orderData.total_amount, points_earned: v.points_earned } })
          } catch (verifyErr) {
            console.error('Verify error:', verifyErr.response?.data || verifyErr.message)
            const msg = verifyErr.response?.data?.message || verifyErr.message || 'Verification failed'
            toast.error(`Order verification failed: ${msg}`, { duration: 8000 })
            handleFailure(msg)
          }
          setPayLoading(false)
        },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r) => {
        handleFailure(r.error.description || 'Payment failed')
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment.')
      setPayLoading(false)
    }
  }

  const handlePay = () => (payMethod === 'cod' || total === 0) ? handleCOD() : handleOnlinePayment()
  const setField = (k, v) => { setAddrForm(f => ({ ...f, [k]: v })); if (addrErrors[k]) setAddrErrors(e => ({ ...e, [k]: '' })) }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-2">Checkout</h1>
      <p className="text-sm text-gray-400 mb-8">Complete your order in 3 easy steps</p>

      {/* ── Step indicator ────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Delivery Address', done: addrDone },
          { n: 2, label: 'Payment Method',   done: payChosen },
          { n: 3, label: 'Place Order',       done: false },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              s.done
                ? 'bg-green-500 text-white'
                : (i === 0 && !addrDone) || (i === 1 && addrDone && !payChosen) || (i === 2 && payChosen)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-400'
            }`}>
              {s.done ? <CheckCircle className="w-3 h-3" /> : <span>{s.n}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── STEP 1: Delivery Address ───────────────── */}
          <div className={`card p-6 transition-all ${addrDone ? 'ring-2 ring-green-400 ring-offset-1' : 'ring-2 ring-primary-400 ring-offset-1'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${addrDone ? 'bg-green-500' : 'bg-primary-500'}`}>
                  {addrDone ? <CheckCircle className="w-4 h-4" /> : '1'}
                </span>
                Delivery Address
              </h2>
              <button onClick={() => { setShowNewAddr(!showNewAddr); setAddrErrors({}) }}
                className="btn-ghost text-sm gap-1.5">
                <Plus className="w-4 h-4" />{showNewAddr ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Saved addresses */}
            <div className="space-y-3 mb-4">
              {addresses.map(addr => (
                <div key={addr.id} onClick={() => { setSelectedAddr(addr); setPayMethod(null) }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddr?.id === addr.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600 hover:border-primary-300'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddr?.id === addr.id ? 'border-primary-500' : 'border-gray-300'}`}>
                        {selectedAddr?.id === addr.id && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {addr.is_default && <span className="badge-gold text-xs">Default</span>}
                      <button onClick={e => { e.stopPropagation(); deleteAddress(addr.id) }} disabled={deletingId === addr.id}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg">
                        {deletingId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && !showNewAddr && (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No saved addresses. Add one below.</p>
                </div>
              )}
            </div>

            {/* New address form */}
            <AnimatePresence>
              {showNewAddr && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100 dark:border-dark-700 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Address</p>
                    <button type="button" onClick={detectLocation} disabled={locating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-sm disabled:opacity-60">
                      {locating ? <><Loader2 className="w-3 h-3 animate-spin" />Detecting…</> : <><Locate className="w-3 h-3" />Use My Location</>}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input value={addrForm.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="e.g. Ramesh Kumar"
                        className={`input text-sm ${addrErrors.full_name ? 'border-red-400' : ''}`} />
                      {addrErrors.full_name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.full_name}</p>}
                    </div>
                    <div>
                      <label className="label">Mobile *</label>
                      <input value={addrForm.phone} onChange={e => setField('phone', e.target.value.replace(/[^\d+\s\-()]/g, '').slice(0, 15))}
                        placeholder="+91 98765 43210" maxLength={15} inputMode="tel"
                        className={`input text-sm ${addrErrors.phone ? 'border-red-400' : ''}`} />
                      {addrErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.phone}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="label">House / Flat / Block *</label>
                      <input value={addrForm.address_line1} onChange={e => setField('address_line1', e.target.value)} placeholder="e.g. #12-3, Sri Nivas Apartments"
                        className={`input text-sm ${addrErrors.address_line1 ? 'border-red-400' : ''}`} />
                      {addrErrors.address_line1 && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.address_line1}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="label">Area / Colony (optional)</label>
                      <input value={addrForm.address_line2} onChange={e => setField('address_line2', e.target.value)} placeholder="e.g. Arundelpet, near Clock Tower" className="input text-sm" />
                    </div>
                    <div>
                      <label className="label">City *</label>
                      <input value={addrForm.city} onChange={e => setField('city', e.target.value)} placeholder="e.g. Guntur"
                        className={`input text-sm ${addrErrors.city ? 'border-red-400' : ''}`} />
                      {addrErrors.city && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.city}</p>}
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <select value={addrForm.state} onChange={e => setField('state', e.target.value)}
                        className={`input text-sm ${addrErrors.state ? 'border-red-400' : ''}`}>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {addrErrors.state && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.state}</p>}
                    </div>
                    <div>
                      <label className="label">Pincode *</label>
                      <input value={addrForm.pincode} onChange={e => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit pincode" maxLength={6} inputMode="numeric"
                        className={`input text-sm ${addrErrors.pincode ? 'border-red-400' : ''}`} />
                      {addrErrors.pincode && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addrErrors.pincode}</p>}
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input value="India" disabled className="input text-sm opacity-60 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button onClick={saveAddress} disabled={savingAddr} className="btn-primary py-2.5 px-6 gap-2">
                      {savingAddr ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4" />Save &amp; Continue</>}
                    </button>
                    <button onClick={() => { setShowNewAddr(false); setAddrErrors({}) }} className="btn-ghost py-2.5 px-4">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── STEP 2: Payment Method (visible only after address selected) ── */}
          <AnimatePresence>
            {addrDone && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.35 }}
                className={`card p-6 transition-all ${payChosen ? 'ring-2 ring-green-400 ring-offset-1' : 'ring-2 ring-primary-400 ring-offset-1'}`}
              >
                <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${payChosen ? 'bg-green-500' : 'bg-primary-500'}`}>
                    {payChosen ? <CheckCircle className="w-4 h-4" /> : '2'}
                  </span>
                  Select Payment Method
                </h2>
                <p className="text-sm text-gray-400 mb-5">Choose how you want to pay for this order</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Online Payment */}
                  <button onClick={() => setPayMethod('online')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${payMethod === 'online' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' : 'border-gray-200 dark:border-dark-600 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${payMethod === 'online' ? 'bg-primary-500' : 'bg-gray-100 dark:bg-dark-700'}`}>
                      <CreditCard className={`w-7 h-7 ${payMethod === 'online' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-bold text-base ${payMethod === 'online' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>Pay Online</p>
                      <p className="text-xs text-gray-400 mt-1">UPI · Cards · Net Banking · Wallets</p>
                    </div>
                    {payMethod === 'online' && (
                      <span className="text-xs font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/40 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>

                  {/* Cash on Delivery */}
                  <button onClick={() => setPayMethod('cod')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${payMethod === 'cod' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md shadow-green-500/10' : 'border-gray-200 dark:border-dark-600 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${payMethod === 'cod' ? 'bg-green-500' : 'bg-gray-100 dark:bg-dark-700'}`}>
                      <Banknote className={`w-7 h-7 ${payMethod === 'cod' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-bold text-base ${payMethod === 'cod' ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Cash on Delivery</p>
                      <p className="text-xs text-gray-400 mt-1">Pay when it arrives 🚚</p>
                    </div>
                    {payMethod === 'cod' && (
                      <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                </div>

                {/* COD delivery info */}
                {payMethod === 'cod' && selectedAddr && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm">
                    <div className="flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-300">Cash on Delivery Details</p>
                        <p className="text-amber-700 dark:text-amber-400 mt-1 text-xs">
                          Delivery to <strong>{selectedAddr.city}</strong> •{' '}
                          {shippingLabel(selectedAddr.city, selectedAddr.pincode, 'cod')}
                        </p>
                        <p className="text-amber-600 dark:text-amber-500 mt-1 text-xs">
                          Please keep exact change ready. Our delivery partner will collect payment at your door.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Online security note */}
                {payMethod === 'online' && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    256-bit SSL encrypted payment via Razorpay · UPI · Cards · Net Banking
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Coupon ─────────────────────────────────── */}
          {addrDone && payChosen && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary-500" /> Coupon Code
              </h2>
              {couponData ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">✅ {couponData.coupon?.code} applied!</p>
                    <p className="text-sm text-green-600">You save ₹{discount}</p>
                  </div>
                  <button onClick={() => { setCouponData(null); setCoupon('') }} className="text-sm text-red-500 font-medium">Remove</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Enter coupon code" className="input flex-1 text-sm uppercase tracking-widest" />
                  <button onClick={applyCoupon} disabled={couponLoading} className="btn-primary px-5 py-2.5">
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Reward Points ──────────────────────────── */}
          {addrDone && payChosen && (profile?.reward_points || 0) > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-secondary-500" /> Reward Points
                <span className="badge-blue ml-2">{profile.reward_points} pts</span>
              </h2>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={maxPoints} step={100} value={pointsToUse} onChange={e => setPointsToUse(+e.target.value)} className="flex-1 accent-secondary-500" />
                <div className="text-right min-w-16">
                  <p className="font-bold text-secondary-600">{pointsToUse} pts</p>
                  <p className="text-xs text-gray-400">= ₹{pointsVal.toFixed(2)} off</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">100 points = ₹1 discount</p>
            </motion.div>
          )}

          {/* ── Cart Items ────────────────────────────── */}
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

        {/* ── Right: Order Summary ──────────────────────── */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-5">Order Summary</h2>
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
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Special Discount ({profile.special_discount}%)</span>
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
                <span>Delivery</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {shipping === 0 ? 'FREE 🎉' : `₹${shipping}`}
                </span>
              </div>
              {selectedAddr && payMethod === 'cod' && (
                <p className="text-xs text-amber-600 italic">
                  {shippingLabel(selectedAddr.city, selectedAddr.pincode, 'cod')}
                </p>
              )}
              {shipping > 0 && payMethod !== 'cod' && (
                <p className="text-xs text-gray-400">Add ₹{Math.max(0, 1000 - subtotal)} more for free delivery</p>
              )}
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                <span className="font-bold text-primary-600 text-xl">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Address & payment method not chosen yet — prompt */}
            {!addrDone && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> Select or add a delivery address to continue
              </div>
            )}
            {addrDone && !payChosen && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-400 text-sm">
                <CreditCard className="w-4 h-4 shrink-0" /> Choose a payment method above to continue
              </div>
            )}

            {/* Pay button — only active after both steps */}
            {payChosen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handlePay}
                disabled={payLoading || items.length === 0}
                className={`w-full justify-center py-4 text-base font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                  payMethod === 'cod'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/20'
                    : 'btn-primary shadow-primary-500/20'
                }`}
              >
                {payLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Processing…</>
                  : total === 0
                    ? <><Gift className="w-5 h-5" />Pay with Points — ₹0</>
                  : payMethod === 'cod'
                    ? <><Banknote className="w-5 h-5" />Place COD Order — ₹{total.toLocaleString('en-IN')}</>
                    : <><CreditCard className="w-5 h-5" />Pay Online — ₹{total.toLocaleString('en-IN')}</>
                }
              </motion.button>
            )}

            {!payChosen && (
              <button disabled className="w-full justify-center py-4 text-base font-bold rounded-xl flex items-center gap-2 bg-gray-100 dark:bg-dark-700 text-gray-400 cursor-not-allowed">
                <ChevronRight className="w-5 h-5" /> Complete steps above
              </button>
            )}

            <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
              {payMethod === 'cod'
                ? <p>🛵 Our delivery partner will collect payment at your door</p>
                : <p>🔒 100% secure payments via Razorpay</p>
              }
              <p>Free returns within 7 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
