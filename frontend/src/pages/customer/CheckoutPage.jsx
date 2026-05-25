import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, CreditCard, Tag, Gift, CheckCircle, ChevronDown, ChevronUp, Edit2, Truck } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const dispatch   = useDispatch()
  const items      = useSelector(selectCartItems)
  const subtotal   = useSelector(selectCartTotal)
  const profile    = useSelector(s => s.auth.profile)

  const [addresses, setAddresses]     = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [newAddr, setNewAddr]         = useState(false)
  const [addrForm, setAddrForm]       = useState({ full_name:'', phone:'', address_line1:'', address_line2:'', city:'', state:'', pincode:'', country:'India' })
  const [coupon, setCoupon]           = useState('')
  const [couponData, setCouponData]   = useState(location.state?.couponData || null)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState(1) // 1=address, 2=review

  const discount   = couponData?.discount || 0
  const pointsVal  = pointsToUse * 0.1
  const shipping   = subtotal > 999 ? 0 : 50
  const total      = Math.max(0, subtotal - discount - pointsVal + shipping)
  const maxPoints  = Math.min(profile?.reward_points || 0, (subtotal - discount) * 10)

  useEffect(() => {
    api.get('/addresses').then(({ data }) => {
      setAddresses(data.data || [])
      const def = (data.data || []).find(a => a.is_default) || (data.data || [])[0]
      if (def) setSelectedAddr(def)
    })
  }, [])

  const saveAddress = async () => {
    if (!addrForm.full_name || !addrForm.phone || !addrForm.address_line1 || !addrForm.city || !addrForm.state || !addrForm.pincode) {
      toast.error('Please fill all required fields'); return
    }
    const { data } = await api.post('/addresses', { ...addrForm, is_default: addresses.length === 0 })
    setAddresses(a => [...a, data.data])
    setSelectedAddr(data.data)
    setNewAddr(false)
    toast.success('Address saved!')
  }

  const loadRazorpayScript = () => new Promise(resolve => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id  = 'rzp-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayment = async () => {
    if (!selectedAddr) { toast.error('Please select a delivery address'); return }
    if (items.length === 0) { toast.error('Your cart is empty'); return }

    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) { toast.error('Failed to load payment gateway. Check your internet connection.'); setLoading(false); return }

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
        key:            orderData.key_id,
        amount:         orderData.amount,
        currency:       orderData.currency,
        name:           'Sri Vijaya Durga Kadi Emporium',
        description:    `Order ${orderData.order_number}`,
        image:          '',
        order_id:       orderData.razorpay_order_id,
        prefill:        orderData.prefill,
        theme:          { color: '#F59E0B' },
        modal: { ondismiss: () => { setLoading(false); toast('Payment cancelled') } },

        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              order_id:            orderData.order_id,
            })
            dispatch(clearCart())
            navigate('/orders/success', {
              state: {
                order_number:  orderData.order_number,
                order_id:      orderData.order_id,
                total_amount:  orderData.total_amount,
                points_earned: verifyData.points_earned,
              }
            })
          } catch (err) {
            toast.error('Payment verification failed. Contact support.')
            navigate('/orders/failure', {
              state: {
                order_id:     orderData.order_id,
                order_number: orderData.order_number,
                total_amount: orderData.total_amount,
                address:      selectedAddr,
                items:        items,
                error:        err.message,
              }
            })
          }
          setLoading(false)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', async (resp) => {
        await api.post('/payments/failure', {
          order_id:          orderData.order_id,
          razorpay_order_id: orderData.razorpay_order_id,
          error_description: resp.error.description,
        }).catch(() => null)
        navigate('/orders/failure', {
          state: {
            order_id:     orderData.order_id,
            order_number: orderData.order_number,
            total_amount: orderData.total_amount,
            address:      selectedAddr,
            items:        items,
            error:        resp.error.description,
          }
        })
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[{n:1,label:'Delivery Address'},{n:2,label:'Review & Pay'}].map((s,i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.n ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{s.n}</div>
            <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-primary-600' : 'text-gray-400'}`}>{s.label}</span>
            {i < 1 && <div className={`h-px w-12 sm:w-24 ${step > s.n ? 'bg-primary-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Address step */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" /> Delivery Address
              </h2>
              <button onClick={() => setNewAddr(!newAddr)}
                className="btn-ghost text-sm gap-1.5"><Plus className="w-4 h-4" /> Add New</button>
            </div>

            {/* Address list */}
            <div className="space-y-3 mb-4">
              {addresses.map(addr => (
                <div key={addr.id}
                  onClick={() => setSelectedAddr(addr)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddr?.id === addr.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600 hover:border-primary-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddr?.id === addr.id ? 'border-primary-500' : 'border-gray-300'}`}>
                        {selectedAddr?.id === addr.id && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    </div>
                    {addr.is_default && <span className="badge-gold text-xs shrink-0">Default</span>}
                  </div>
                </div>
              ))}
              {addresses.length === 0 && !newAddr && (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No addresses saved. Add one below.</p>
                </div>
              )}
            </div>

            {/* New address form */}
            <AnimatePresence>
              {newAddr && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100 dark:border-dark-700 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key:'full_name', label:'Full Name *', cols:1, placeholder:'Name' },
                      { key:'phone', label:'Phone *', cols:1, placeholder:'10-digit number' },
                      { key:'address_line1', label:'Address Line 1 *', cols:2, placeholder:'House/Flat/Block No.' },
                      { key:'address_line2', label:'Address Line 2', cols:2, placeholder:'Area, Colony (optional)' },
                      { key:'city', label:'City *', cols:1, placeholder:'City' },
                      { key:'state', label:'State *', cols:1, placeholder:'State' },
                      { key:'pincode', label:'Pincode *', cols:1, placeholder:'6-digit pincode' },
                    ].map(f => (
                      <div key={f.key} className={f.cols === 2 ? 'col-span-2' : ''}>
                        <label className="label">{f.label}</label>
                        <input value={addrForm[f.key]} onChange={e => setAddrForm(a => ({...a, [f.key]: e.target.value}))}
                          placeholder={f.placeholder} className="input text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveAddress} className="btn-primary py-2.5 px-6">Save Address</button>
                    <button onClick={() => setNewAddr(false)} className="btn-ghost py-2.5 px-4">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rewards redemption */}
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
                <div className="text-right">
                  <p className="font-bold text-secondary-600">{pointsToUse} pts</p>
                  <p className="text-xs text-gray-400">= ₹{pointsVal.toFixed(2)} off</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">1 point = ₹0.10 discount</p>
            </div>
          )}

          {/* Cart summary */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-500" /> Order Items ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={item.product.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product.name}</p>
                    {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">×{item.quantity}</p>
                    <p className="text-sm text-primary-600 font-bold">₹{((item.product.discount_price || item.product.price) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-5">Payment Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({couponData?.coupon?.code})</span><span>-₹{discount}</span>
                </div>
              )}
              {pointsVal > 0 && (
                <div className="flex justify-between text-secondary-600">
                  <span>Points Redemption</span><span>-₹{pointsVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-900 dark:text-white'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                <span className="font-bold text-primary-600 text-xl">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button onClick={handlePayment} disabled={loading || !selectedAddr}
              className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50">
              {loading ? (
                <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</div>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay ₹{total.toLocaleString('en-IN')}</>
              )}
            </button>

            <div className="mt-4 space-y-1.5 text-xs text-gray-400 text-center">
              <p>🔒 256-bit SSL encrypted payment</p>
              <p>Powered by Razorpay · UPI · Cards · Wallets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
