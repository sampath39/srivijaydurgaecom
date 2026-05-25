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

// Helper function to calculate order totals
async function calculateOrderDetails({ user_id, cart_items, address_id, coupon_code, points_to_use }) {
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
    .select('reward_points')
    .eq('id', user_id)
    .single()

  const usablePoints = Math.min(points_to_use, profile?.reward_points || 0)
  pointsValue = usablePoints * 0.1 // 1 point = ₹0.10

  // 5. Calculate total
  const shippingCharge = subtotal > 999 ? 0 : 50
  const totalAmount = Math.max(0, subtotal - discountAmount - pointsValue + shippingCharge)

  return {
    address,
    validatedItems,
    subtotal,
    discountAmount,
    couponId,
    usablePoints,
    pointsValue,
    shippingCharge,
    totalAmount,
  }
}

// ── POST /api/payments/create-order ───────────────────────────
// Creates a Razorpay order ONLY (does NOT store pending order in DB)
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

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `svdke_${Date.now()}`,
      notes: {
        user_id:  req.user.id,
        shop:     'Sri Vijaya Durga Kadi Emporium',
        address:  `${details.address.address_line1}, ${details.address.city}`,
      },
    })

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
      discount_amount:   details.discountAmount,
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
// Verifies signature, then stores the successful order in DB
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cart_items,
      address_id,
      coupon_code,
      points_to_use = 0,
    } = req.body

    // 1. Verify payment signature
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' })
    }

    // 2. Perform order calculations (stock, coupons, points)
    const details = await calculateOrderDetails({
      user_id: req.user.id,
      cart_items,
      address_id,
      coupon_code,
      points_to_use,
    })

    // 3. Save the successful order in DB
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.user.id,
        status:           'confirmed',
        payment_status:   'paid',
        payment_method:   'razorpay',
        subtotal:         details.subtotal,
        discount_amount:  details.discountAmount,
        points_used:      details.usablePoints,
        points_value:     details.pointsValue,
        shipping_charge:  details.shippingCharge,
        total_amount:     details.totalAmount,
        coupon_id:        details.couponId,
        address_id:       details.address.id,
        address_snapshot: details.address,
        notes: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }),
      })
      .select()
      .single()

    if (orderErr) {
      console.error('Order verify insert error:', orderErr)
      return res.status(500).json({ success: false, message: 'Failed to record the order in database' })
    }

    // 4. Save order items
    const orderItems = details.validatedItems.map(item => ({
      order_id:         order.id,
      product_id:       item.product.id,
      product_snapshot: {
        name:   item.product.name,
        image:  item.product.images?.[0],
        price:  item.unitPrice,
      },
      quantity:    item.quantity,
      size:        item.size,
      unit_price:  item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }))

    await supabase.from('order_items').insert(orderItems)

    // 5. Deduct stock
    for (const item of details.validatedItems) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product.id,
        p_quantity:   item.quantity,
      }).catch(() => null)
    }

    // 6. Award reward points (₹100 = 10 pts)
    const pointsEarned = Math.floor(order.total_amount / 10)
    if (pointsEarned > 0) {
      await supabase.from('reward_points').insert({
        user_id:     req.user.id,
        points:      pointsEarned,
        type:        'earned',
        description: `Order ${order.order_number}`,
        order_id:    order.id,
      })
      await supabase.rpc('increment_points', {
        p_user_id: req.user.id,
        p_points:  pointsEarned,
      }).catch(() => null)
    }

    // 7. Deduct used points
    if (order.points_used > 0) {
      await supabase.from('reward_points').insert({
        user_id:     req.user.id,
        points:      -order.points_used,
        type:        'redeemed',
        description: `Redeemed for order ${order.order_number}`,
        order_id:    order.id,
      })
      await supabase.rpc('increment_points', {
        p_user_id: req.user.id,
        p_points:  -order.points_used,
      }).catch(() => null)
    }

    // 8. Clear user cart
    await supabase.from('carts').delete().eq('user_id', req.user.id)

    // 9. Increment coupon usage
    if (order.coupon_id) {
      await supabase.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id }).catch(() => null)
    }

    // 10. Notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title:   '🎉 Order Confirmed!',
      message: `Your order ${order.order_number} has been placed successfully.`,
      type:    'order',
      link:    `/orders/${order.id}`,
    })

    return res.json({
      success:       true,
      message:       'Payment verified and order saved successfully',
      order_id:      order.id,
      order_number:  order.order_number,
      points_earned: pointsEarned,
    })
  } catch (err) {
    console.error('verify error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/payments/key ─────────────────────────────────────
router.get('/key', (_req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID })
})

module.exports = router
