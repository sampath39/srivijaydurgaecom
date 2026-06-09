import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, CreditCard, Tag, Gift, CheckCircle,
  Trash2, Truck, AlertCircle, Loader2, Banknote, Locate,
  ChevronRight, ShieldCheck, Search, Map, X
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice'
import { setProfile } from '../../store/slices/authSlice'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { loadGoogleMapsScript, parseGooglePlace, searchAddressOSM } from '../../lib/maps'

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
  if (c === 'guntur' || (p >= 522001 && p <= 522299)) return 0
  if (p >= 500000 && p <= 535999) return 40
  if (p >= 560000 && p <= 641999) return 80
  if (p >= 400000 && p <= 431999) return 100
  return 150
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
  const res  = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'SVDKE-App' } }
  )
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

// ── Leaflet Map Modal ─────────────────────────────────────────
function MapPickerModal({ onClose, onSelect, initialLat, initialLng }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [geoInfo, setGeoInfo] = useState(null)
  const [resolving, setResolving] = useState(false)

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      // Add CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Add JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      initMap()
    }

    const initMap = () => {
      if (!mapRef.current || leafletMapRef.current) return
      const L = window.L
      const startLat = initialLat || 16.3067  // Guntur default
      const startLng = initialLng || 80.4365

      const map = L.map(mapRef.current, { zoomControl: true }).setView([startLat, startLng], 15)
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Custom red drop pin icon
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;
          background:linear-gradient(135deg,#f59e0b,#ef4444);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([startLat, startLng], { draggable: true, icon }).addTo(map)
        .bindPopup('<b>📍 Drag me to your location</b>').openPopup()
      markerRef.current = marker

      const doReverseGeocode = async (lat, lng) => {
        setResolving(true)
        try {
          const info = await reverseGeocode(lat, lng)
          setGeoInfo({ lat, lng, ...info })
        } catch {
          setGeoInfo({ lat, lng, address_line1: '', address_line2: '', city: '', state: '', pincode: '' })
        }
        setResolving(false)
      }

      // Reverse geocode on drag end
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        doReverseGeocode(lat, lng)
      })

      // Click on map to move pin
      map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        doReverseGeocode(e.latlng.lat, e.latlng.lng)
      })

      // Initial geocode
      doReverseGeocode(startLat, startLng)
      setLoading(false)
    }

    loadLeaflet().catch(() => {
      setLoading(false)
      toast.error('Could not load map. Please fill address manually.')
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  const handleConfirm = () => {
    if (!geoInfo) return
    const matched = INDIAN_STATES.find(s =>
      s.toLowerCase().trim() === (geoInfo.state || '').toLowerCase().trim()
    ) || ''
    onSelect({
      address_line1: geoInfo.address_line1,
      address_line2: geoInfo.address_line2,
      city: geoInfo.city,
      state: matched,
      pincode: geoInfo.pincode,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Map className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Pick Location on Map</h3>
              <p className="text-xs text-gray-400">Click or drag the pin to your exact location</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-dark-700">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading map…</p>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ height: 360 }} />
        </div>

        {/* Geocoded address preview */}
        <div className="p-4 bg-gray-50 dark:bg-dark-700/50">
          {resolving ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Getting address…
            </div>
          ) : geoInfo ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detected Address</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {[geoInfo.address_line1, geoInfo.address_line2, geoInfo.city, geoInfo.state, geoInfo.pincode]
                  .filter(Boolean).join(', ') || 'Move the pin to get address details'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Move the pin on the map to auto-fill your address</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-dark-700">
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!geoInfo || resolving}
            className="btn-primary flex-1 py-2.5 text-sm gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Use This Location
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const items    = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartTotal)
  const profile  = useSelector(s => s.auth.profile)

  // Address
  const [addresses, setAddresses]       = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [showNewAddr, setShowNewAddr]   = useState(false)
  const [addrForm, setAddrForm]         = useState(EMPTY_FORM)
  const [addrErrors, setAddrErrors]     = useState({})
  const [savingAddr, setSavingAddr]     = useState(false)
  const [deletingId, setDeletingId]     = useState(null)
  const [locating, setLocating]         = useState(false)

  // Map picker
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [mapInitLat, setMapInitLat]       = useState(null)
  const [mapInitLng, setMapInitLng]       = useState(null)

  // Google Maps Autocomplete
  const [googleLoaded, setGoogleLoaded]   = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const [suggestions, setSuggestions]     = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Load Google Maps Place Autocomplete when new address form opens
  useEffect(() => {
    if (!showNewAddr) return
    loadGoogleMapsScript((success) => {
      setGoogleLoaded(success)
      if (success && window.google) {
        setTimeout(() => {
          const input = document.getElementById('addr-search-autocomplete')
          if (input) {
            const autocomplete = new window.google.maps.places.Autocomplete(input, {
              componentRestrictions: { country: 'in' },
              fields: ['address_components', 'formatted_address', 'geometry', 'name']
            })
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace()
              const parsed = parseGooglePlace(place)
              if (parsed) {
                setAddrForm(f => ({
                  ...f,
                  address_line1: parsed.address_line1,
                  address_line2: parsed.address_line2 || f.address_line2,
                  city: parsed.city || f.city,
                  state: parsed.state || f.state,
                  pincode: parsed.pincode || f.pincode,
                }))
                setSearchQuery(place.formatted_address || '')
                setAddrErrors({})
                toast.success('Address populated from Google Maps!')
              }
            })
          }
        }, 300)
      }
    })
  }, [showNewAddr])

  // Handle click outside suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = () => setShowSuggestions(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleSearchChange = async (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (googleLoaded) return // Google Autocomplete handles inputs directly
    if (val.length >= 3) {
      const results = await searchAddressOSM(val)
      setSuggestions(results)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (s) => {
    setAddrForm(f => ({
      ...f,
      address_line1: s.address_line1 || f.address_line1,
      address_line2: s.address_line2 || f.address_line2,
      city: s.city || f.city,
      state: s.state || f.state,
      pincode: s.pincode || f.pincode,
    }))
    setSearchQuery(s.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setAddrErrors({})
    toast.success('Address populated!')
  }

  // Payment
  const [payMethod, setPayMethod]       = useState(null)
  const [coupon, setCoupon]             = useState('')
  const [couponData, setCouponData]     = useState(location.state?.couponData || null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [pointsToUse, setPointsToUse]   = useState(0)
  const [payLoading, setPayLoading]     = useState(false)

  const specialDiscount = profile?.special_discount > 0
    ? Math.round((subtotal * profile.special_discount) / 100) : 0
  const discount  = couponData?.discount || 0
  const pointsVal = pointsToUse * 0.01
  const shipping  = selectedAddr
    ? calcShipping(selectedAddr.city, selectedAddr.pincode, subtotal, payMethod || 'online')
    : (subtotal > 999 ? 0 : 50)
  const total     = Math.max(0, subtotal - discount - pointsVal - specialDiscount + shipping)
  const maxPoints = Math.min(profile?.reward_points || 0, (subtotal - discount - specialDiscount) * 100)

  const addrDone  = !!selectedAddr
  const payChosen = !!payMethod

  // ── Load saved addresses ───────────────────────────────────
  useEffect(() => {
    api.get('/auth/profile').then(({ data }) => {
      if (data?.data) dispatch(setProfile(data.data))
    }).catch(() => {})

    api.get('/addresses').then(({ data }) => {
      const list = data.data || []
      setAddresses(list)
      const def = list.find(a => a.is_default) || list[0]
      if (def) setSelectedAddr(def)
      if (list.length === 0) setShowNewAddr(true)
    }).catch(() => { toast.error('Could not load addresses.'); setShowNewAddr(true) })
  }, [])

  // ── Detect GPS location ───────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        // Open map centered at GPS coords
        setMapInitLat(coords.latitude)
        setMapInitLng(coords.longitude)
        setShowMapPicker(true)
      },
      err => {
        setLocating(false)
        toast.error(err.code === 1 ? 'Location permission denied.' : 'Could not get location.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // ── Open blank map picker (Guntur default) ─────────────────
  const openMapPicker = () => {
    setMapInitLat(null)
    setMapInitLng(null)
    setShowMapPicker(true)
  }

  // ── Map location selected callback ─────────────────────────
  const handleMapSelect = (geo) => {
    setAddrForm(f => ({
      ...f,
      address_line1: geo.address_line1 || f.address_line1,
      address_line2: geo.address_line2 || f.address_line2,
      city: geo.city || f.city,
      state: geo.state || f.state,
      pincode: geo.pincode || f.pincode,
    }))
    setAddrErrors({})
    toast.success('📍 Location picked! Please verify and complete the form.')
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
        cart_items: cartPayload,
        address_id: selectedAddr.id,
        coupon_code: couponData?.coupon?.code || '',
        points_to_use: pointsToUse,
      })
      dispatch(clearCart())
      navigate('/orders/success', {
        state: {
          order_number: data.order_number,
          order_id: data.order_id,
          total_amount: data.total_amount,
          points_earned: data.points_earned,
          is_cod: true,
          city: selectedAddr.city,
          pincode: selectedAddr.pincode,
        }
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place COD order.')
    } finally { setPayLoading(false) }
  }

  // ── Razorpay handler ─────────────────────────────────────
  const loadRazorpay = () => new Promise(resolve => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const s = document.createElement('script')
    s.id = 'rzp-script'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const handleOnlinePayment = async () => {
    if (!selectedAddr || !payMethod) return
    setPayLoading(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) {
        toast.error('Failed to load payment gateway. Please try again.')
        setPayLoading(false)
        return
      }

      const cartPayload = items.map(i => ({ product_id: i.product.id, quantity: i.quantity, size: i.size }))
      const checkoutArgs = {
        cart_items: cartPayload,
        address_id: selectedAddr.id,
        coupon_code: couponData?.coupon?.code || '',
        points_to_use: pointsToUse,
      }

      const { data: orderData } = await api.post('/payments/create-order', checkoutArgs)

      const handleFailure = (errDescription) => {
        setPayLoading(false)
        navigate('/orders/failure', {
          state: {
            total_amount:   orderData?.total_amount,
            address:        selectedAddr,
            items:          items.map(i => ({ product: i.product, quantity: i.quantity, size: i.size })),
            error:          errDescription || 'Payment was not completed',
            coupon_code:    checkoutArgs.coupon_code,
            points_to_use:  checkoutArgs.points_to_use,
          }
        })
      }

      const options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'Sri Vijaya Durga Kadi Emporium',
        description: 'Order Payment',
        order_id:    orderData.razorpay_order_id,
        prefill:     orderData.prefill,
        theme:       { color: '#F59E0B' },
        modal:       { ondismiss: () => handleFailure('Payment cancelled by user') },
        handler: async (response) => {
          try {
            const { data: v } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              ...checkoutArgs,
            })
            dispatch(clearCart())
            navigate('/orders/success', {
              state: {
                order_number:  v.order_number,
                order_id:      v.order_id,
                total_amount:  orderData.total_amount,
                points_earned: v.points_earned,
                city:          selectedAddr.city,
                pincode:       selectedAddr.pincode,
              }
            })
          } catch (verifyErr) {
            const msg = verifyErr.response?.data?.message || verifyErr.message || 'Verification failed'
            console.error('[checkout] Verify error:', msg)
            toast.error(`Payment verification failed: ${msg}`, { duration: 8000 })
            handleFailure(msg)
          }
          setPayLoading(false)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r) => handleFailure(r.error.description || 'Payment failed'))
      rzp.open()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate payment.'
      toast.error(msg)
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
                    {/* Location action buttons */}
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={openMapPicker}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg shadow-sm">
                        <Map className="w-3 h-3" /> Pick on Map
                      </button>
                      <button type="button" onClick={detectLocation} disabled={locating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-sm disabled:opacity-60">
                        {locating ? <><Loader2 className="w-3 h-3 animate-spin" />Detecting…</> : <><Locate className="w-3 h-3" />Use GPS</>}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 relative" onClick={e => e.stopPropagation()}>
                      <label className="label text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-primary-500" /> Search Address (Google Maps / Auto-fill)
                      </label>
                      <div className="relative">
                        <input
                          id="addr-search-autocomplete"
                          type="text"
                          placeholder="Start typing your address (e.g. Arundelpet, Guntur...)"
                          className="input text-sm pl-10"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onFocus={() => setShowSuggestions(true)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                        {/* Suggestions Dropdown for OSM fallback */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full text-left px-4 py-3 text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-dark-700 last:border-0 truncate"
                                onClick={() => handleSelectSuggestion(s)}
                              >
                                {s.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

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

          {/* ── STEP 2: Payment Method ─────────────────── */}
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
              {selectedAddr && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {(() => {
                      const c = (selectedAddr.city || '').toLowerCase().trim()
                      const p = parseInt((selectedAddr.pincode || '').replace(/\D/g, '') || '0', 10)
                      if (c === 'guntur' || (p >= 522001 && p <= 522299)) return '1 day (Local Delivery)'
                      return '5 days'
                    })()}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-dark-700 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                <span className="font-bold text-primary-600 text-xl">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Prompts */}
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

            {/* Pay button */}
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

      {/* ── Leaflet Map Picker Modal ──────────────────────── */}
      <AnimatePresence>
        {showMapPicker && (
          <MapPickerModal
            onClose={() => setShowMapPicker(false)}
            onSelect={handleMapSelect}
            initialLat={mapInitLat}
            initialLng={mapInitLng}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
