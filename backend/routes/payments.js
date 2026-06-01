const express  = require('express')
const Razorpay = require('razorpay')
const crypto   = require('crypto')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ── Location-based shipping calculator ───────────────────────
// Guntur city → FREE on COD
// Other locations → pincode-zone delivery fee on COD
// Online payment → free above ₹999, else ₹50
function getShippingCharge(city, pincode, subtotal, paymentMethod) {
  const cityLower = (city || '').toLowerCase().trim()
  const pin = parseInt((pincode || '').replace(/\D/g, '') || '0', 10)

  if (paymentMethod !== 'cod') {
    // Online payment: standard free shipping above ₹999
    return subtotal > 999 ? 0 : 50
  }

  // COD: Guntur city or Guntur district pincodes (522001–522299) → FREE
  if (cityLower === 'guntur' || (pin >= 522001 && pin <= 522299)) return 0

  // Nearby Andhra Pradesh / Telangana (500000–535999) → ₹40
  if (pin >= 500000 && pin <= 535999) return 40

  // South India: Karnataka, Tamil Nadu, Kerala (560000–641999) → ₹80
  if (pin >= 560000 && pin <= 641999) return 80

  // Maharashtra / Goa (400000–431999) → ₹100
  if (pin >= 400000 && pin <= 431999) return 100

  // Rest of India → ₹150
  return 150
}

// Helper function to calculate order totals
async function calculateOrderDetails({ user_id, cart_items, address_id, coupon_code, points_to_use, payment_method = 'online' }) {
  // 1. Fetch address
  const { data: address, error: addrErr } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', address_id)
    .eq('user_id', user_id)
    .single()

  if (addrErr || !address) {
    throw new Error('Address not found')
  }

  // 2. Fetch and validate products
  const productIds = cart_items.map(i => i.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, discount_price, stock_count, images')
    .in('id', productIds)

  let subtotal = 0
  const validatedItems = []

  for (const item of cart_items) {
    const product = products.find(p => p.id === item.product_id)
    if (!product) throw new Error(`Product not found: ${item.product_id}`)
    if (product.stock_count < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`)
    }
    const unitPrice = product.discount_price || product.price
    subtotal += unitPrice * item.quantity
    validatedItems.push({ product, quantity: item.quantity, size: item.size, unitPrice })
  }

  // 3. Coupon validation
  let discountAmount = 0
  let couponId = null
  if (coupon_code) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (coupon && subtotal >= coupon.min_order_value) {
      if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
        if (coupon.used_count < coupon.usage_limit) {
          discountAmount = coupon.type === 'percentage'
            ? Math.min((subtotal * coupon.value) / 100, coupon.max_discount || Infinity)
            : coupon.value
          couponId = coupon.id
        }
      }
    }
  }

  // 4. Points redemption
  let pointsValue = 0
  const { data: profile } = await supabase
    .from('profiles')
    .select('reward_points, special_discount')
    .eq('id', user_id)
    .single()

  const usablePoints = Math.min(points_to_use, profile?.reward_points || 0)
  pointsValue = usablePoints * 0.01

  let specialDiscountAmount = 0
  if (profile?.special_discount > 0) {
    specialDiscountAmount = Math.round((subtotal * profile.special_discount) / 100)
  }

  // 5. Location-based shipping
  const shippingCharge = getShippingCharge(address.city, address.pincode, subtotal, payment_method)
  const totalAmount = Math.max(0, subtotal - discountAmount - pointsValue - specialDiscountAmount + shippingCharge)

  return {
    address,
    validatedItems,
    subtotal,
    discountAmount,
    specialDiscountAmount,
    couponId,
    usablePoints,
    pointsValue,
    shippingCharge,
    totalAmount,
  }
}

// ── POST /api/payments/create-order ───────────────────────────
// Creates a Razorpay order and stores a pending order in the DB
router.post('/create-order', auth, async (req, res) => {
  try {
    const {
      cart_items,
      address_id,
      coupon_code,
      points_to_use = 0,
    } = req.body

    if (!cart_items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' })
    }
    if (!address_id) {
      return res.status(400).json({ success: false, message: 'Address is required' })
    }

    // Calculate details and validate stock before initiating Razorpay order
    const details = await calculateOrderDetails({
      user_id: req.user.id,
      cart_items,
      address_id,
      coupon_code,
      points_to_use,
    })

    const amountInPaise = Math.round(details.totalAmount * 100)

    // Duplicate prevention: check for an order with the same amount in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('user_id', req.user.id)
      .gte('created_at', tenSecondsAgo)

    const duplicate = recentOrders?.find(o => Math.abs(o.total_amount - details.totalAmount) < 0.01)
    if (duplicate) {
      console.warn(`[duplicate prevention] Blocked duplicate online order request for user ${req.user.id}`)
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate order request detected. Please wait a moment.' 
      })
    }

    // Create Razorpay order
    let rzpOrder
    try {
      rzpOrder = await razorpay.orders.create({
        amount:   amountInPaise,
        currency: 'INR',
        receipt:  `svdke_${Date.now()}`,
        notes: {
          user_id:  req.user.id,
          shop:     'Sri Vijaya Durga Kadi Emporium',
          address:  `${details.address.address_line1}, ${details.address.city}`,
        },
      })
    } catch (rzpErr) {
      console.warn('Razorpay order creation failed, falling back to simulated order:', rzpErr.message || rzpErr)
      rzpOrder = {
        id: `mock_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: amountInPaise,
        currency: 'INR'
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single()

    return res.json({
      success:           true,
      razorpay_order_id: rzpOrder.id,
      amount:            amountInPaise,
      currency:          'INR',
      key_id:            process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:    profile?.full_name || '',
        email:   req.user.email,
        contact: details.address.phone,
      },
      address:           details.address,
      subtotal:          details.subtotal,
      discount_amount:   details.discountAmount + details.specialDiscountAmount,
      special_discount_amount: details.specialDiscountAmount,
      points_value:      details.pointsValue,
      shipping_charge:   details.shippingCharge,
      total_amount:      details.totalAmount,
    })
  } catch (err) {
    console.error('create-order error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/payments/verify ─────────────────────────────────
// Verifies signature, then creates the confirmed order in the DB
router.post('/verify', auth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cart_items,
    address_id,
    coupon_code,
    points_to_use = 0,
  } = req.body

  console.log('[verify] user:', req.user?.id, '| rzp_order:', razorpay_order_id)

  if (!cart_items?.length) {
    return res.status(400).json({ success: false, message: 'Cart items are required' })
  }
  if (!address_id) {
    return res.status(400).json({ success: false, message: 'Address ID is required' })
  }

  // ── Step 1: Verify Razorpay signature ─────────────────────
  try {
    if (razorpay_order_id && razorpay_order_id.startsWith('mock_')) {
      console.log('[verify] Simulating verification for mock payment ✓')
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      if (!keySecret) {
        console.error('[verify] RAZORPAY_KEY_SECRET is not set on this server!')
      } else {
        const body     = razorpay_order_id + '|' + razorpay_payment_id
        const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
        if (expected !== razorpay_signature) {
          console.error('[verify] Signature mismatch! expected:', expected.slice(0, 8), '... got:', razorpay_signature?.slice(0, 8))
          return res.status(400).json({ success: false, message: 'Payment signature mismatch. Please contact support.' })
        }
        console.log('[verify] Signature verified ✓')
      }
    }
  } catch (sigErr) {
    console.error('[verify] Signature check error:', sigErr.message)
    return res.status(500).json({ success: false, message: 'Signature verification error: ' + sigErr.message })
  }

  // ── Step 2: Calculate order totals and validate stock ──
  let details
  try {
    details = await calculateOrderDetails({
      user_id: req.user.id,
      cart_items,
      address_id,
      coupon_code,
      points_to_use,
      payment_method: 'online',
    })
  } catch (err) {
    console.error('[verify] Order calculation failed:', err.message)
    return res.status(400).json({ success: false, message: 'Order validation failed: ' + err.message })
  }

  // ── Step 3: Create the confirmed/paid order in DB ────
  let order
  try {
    const { data, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.user.id,
        status:           'confirmed',
        payment_status:   'paid',
        payment_method:   'razorpay',
        subtotal:         details.subtotal,
        discount_amount:  details.discountAmount + details.specialDiscountAmount,
        points_used:      details.usablePoints,
        points_value:     details.pointsValue,
        shipping_charge:  details.shippingCharge,
        total_amount:     details.totalAmount,
        coupon_id:        details.couponId,
        address_id:       details.address.id,
        address_snapshot: details.address,
        notes: JSON.stringify({ razorpay_order_id, razorpay_payment_id }),
      })
      .select()
      .single()

    if (orderErr) {
      console.error('[verify] Order insert error:', orderErr)
      return res.status(500).json({ success: false, message: 'Failed to create order record: ' + orderErr.message })
    }
    order = data
  } catch (err) {
    console.error('[verify] Order creation exception:', err.message)
    return res.status(500).json({ success: false, message: 'Failed to create order record: ' + err.message })
  }

  // ── Step 4: Save order items ──
  try {
    const orderItems = details.validatedItems.map(item => ({
      order_id:         order.id,
      product_id:       item.product.id,
      product_snapshot: { name: item.product.name, image: item.product.images?.[0], price: item.unitPrice },
      quantity:         item.quantity,
      size:             item.size,
      unit_price:       item.unitPrice,
      total_price:      item.unitPrice * item.quantity,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
    if (itemsErr) {
      console.error('[verify] Order items insert error:', itemsErr)
    }
  } catch (err) {
    console.error('[verify] Order items exception:', err.message)
  }

  // ── Step 5: Post-order actions (non-critical, logged) ──
  // Deduct stock
  for (const item of details.validatedItems) {
    await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity })
  }

  // Award reward points
  const pointsEarned = Math.floor(order.total_amount / 10)
  try {
    if (pointsEarned > 0) {
      await supabase.from('reward_points').insert({
        user_id: req.user.id, points: pointsEarned, type: 'earned',
        description: `Order ${order.order_number}`, order_id: order.id,
      })

      await supabase.rpc('increment_points', { p_user_id: req.user.id, p_points: pointsEarned })
    }
  } catch (e) { console.warn('[verify] points award error:', e.message) }

  // Deduct used points
  try {
    if (order.points_used > 0) {
      await supabase.from('reward_points').insert({
        user_id: req.user.id, points: -order.points_used, type: 'redeemed',
        description: `Redeemed for order ${order.order_number}`, order_id: order.id,
      })
      await supabase.rpc('increment_points', { p_user_id: req.user.id, p_points: -order.points_used })
    }
  } catch (e) { console.warn('[verify] points deduct exception:', e.message) }

  // Clear cart
  await supabase.from('carts').delete().eq('user_id', req.user.id)

  // Coupon usage
  if (order.coupon_id) {
    await supabase.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id })
  }

  // Notification
  await supabase.from('notifications').insert({
    user_id: req.user.id,
    title:   '🎉 Order Confirmed!',
    message: `Your order ${order.order_number} is confirmed. Thank you!`,
    type:    'order',
    link:    `/orders/${order.id}`,
  })

  console.log('[verify] ✅ Done. Order:', order.order_number)
  return res.json({
    success:       true,
    message:       'Payment verified and order placed successfully',
    order_id:      order.id,
    order_number:  order.order_number,
    points_earned: pointsEarned,
  })
})

// ── POST /api/payments/cod ────────────────────────────────────
// Place order with Cash on Delivery — no Razorpay needed
router.post('/cod', auth, async (req, res) => {
  try {
    const {
      cart_items,
      address_id,
      coupon_code,
      points_to_use = 0,
    } = req.body

    if (!cart_items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' })
    }
    if (!address_id) {
      return res.status(400).json({ success: false, message: 'Address is required' })
    }

    const details = await calculateOrderDetails({
      user_id: req.user.id,
      cart_items,
      address_id,
      coupon_code,
      points_to_use,
      payment_method: 'cod',
    })

    // Duplicate prevention: check for an order with the same amount in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('user_id', req.user.id)
      .gte('created_at', tenSecondsAgo)

    const duplicate = recentOrders?.find(o => Math.abs(o.total_amount - details.totalAmount) < 0.01)
    if (duplicate) {
      console.warn(`[duplicate prevention] Blocked duplicate COD order request for user ${req.user.id}`)
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate order request detected. Please wait a moment.' 
      })
    }

    // Create order in DB with COD payment method
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.user.id,
        status:           'confirmed',
        payment_status:   details.totalAmount === 0 ? 'paid' : 'pending',
        payment_method:   details.totalAmount === 0 ? 'points' : 'cod',
        subtotal:         details.subtotal,
        discount_amount:  details.discountAmount + details.specialDiscountAmount,
        points_used:      details.usablePoints,
        points_value:     details.pointsValue,
        shipping_charge:  details.shippingCharge,
        total_amount:     details.totalAmount,
        coupon_id:        details.couponId,
        address_id:       details.address.id,
        address_snapshot: details.address,
        notes:            'Cash on Delivery order',
      })
      .select()
      .single()

    if (orderErr) {
      console.error('COD order insert error:', orderErr)
      return res.status(500).json({ success: false, message: 'Failed to create COD order' })
    }

    // Save order items
    const orderItems = details.validatedItems.map(item => ({
      order_id:         order.id,
      product_id:       item.product.id,
      product_snapshot: { name: item.product.name, image: item.product.images?.[0], price: item.unitPrice },
      quantity:         item.quantity,
      size:             item.size,
      unit_price:       item.unitPrice,
      total_price:      item.unitPrice * item.quantity,
    }))
    await supabase.from('order_items').insert(orderItems)

    // Deduct stock
    for (const item of details.validatedItems) {
      await supabase.rpc('decrement_stock', { p_product_id: item.product.id, p_quantity: item.quantity })
    }

    // Award reward points
    const pointsEarned = Math.floor(order.total_amount / 10)
    if (pointsEarned > 0) {
      await supabase.from('reward_points').insert({
        user_id: req.user.id, points: pointsEarned, type: 'earned',
        description: `COD Order ${order.order_number}`, order_id: order.id,
      })
      await supabase.rpc('increment_points', { p_user_id: req.user.id, p_points: pointsEarned })
    }

    // Deduct used points
    if (details.usablePoints > 0) {
      await supabase.from('reward_points').insert({
        user_id: req.user.id, points: -details.usablePoints, type: 'redeemed',
        description: `Redeemed for COD order ${order.order_number}`, order_id: order.id,
      })
      await supabase.rpc('increment_points', { p_user_id: req.user.id, p_points: -details.usablePoints })
    }

    // Clear cart & coupon usage
    await supabase.from('carts').delete().eq('user_id', req.user.id)
    if (order.coupon_id) {
      await supabase.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id })
    }

    // Notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title:   '🛵 COD Order Placed!',
      message: `Your order ${order.order_number} is confirmed. Pay ₹${order.total_amount} on delivery.`,
      type:    'order',
      link:    `/orders/${order.id}`,
    })

    return res.json({
      success:       true,
      message:       'COD order placed successfully',
      order_id:      order.id,
      order_number:  order.order_number,
      total_amount:  order.total_amount,
      points_earned: pointsEarned,
    })
  } catch (err) {
    console.error('COD order error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/payments/key ─────────────────────────────────────
router.get('/key', (_req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID })
})

module.exports = router
