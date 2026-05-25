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

// ── POST /api/payments/create-order ───────────────────────────
// Creates a Razorpay order and saves a pending order in DB
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

    // ── Fetch address ────────────────────────────────────────
    const { data: address, error: addrErr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', req.user.id)
      .single()

    if (addrErr || !address) {
      return res.status(404).json({ success: false, message: 'Address not found' })
    }

    // ── Fetch & validate products ────────────────────────────
    const productIds = cart_items.map(i => i.product_id)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, discount_price, stock_count, images')
      .in('id', productIds)

    let subtotal = 0
    const validatedItems = []

    for (const item of cart_items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product_id}` })
      if (product.stock_count < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` })
      }
      const unitPrice = product.discount_price || product.price
      subtotal += unitPrice * item.quantity
      validatedItems.push({ product, quantity: item.quantity, size: item.size, unitPrice })
    }

    // ── Coupon validation ────────────────────────────────────
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

    // ── Points redemption ────────────────────────────────────
    let pointsValue = 0
    const { data: profile } = await supabase
      .from('profiles')
      .select('reward_points')
      .eq('id', req.user.id)
      .single()

    const usablePoints = Math.min(points_to_use, profile?.reward_points || 0)
    pointsValue = usablePoints * 0.1 // 1 point = ₹0.10

    // ── Calculate total ──────────────────────────────────────
    const shippingCharge = subtotal > 999 ? 0 : 50
    const totalAmount = Math.max(0, subtotal - discountAmount - pointsValue + shippingCharge)
    const amountInPaise = Math.round(totalAmount * 100)

    // ── Create Razorpay order ────────────────────────────────
    const rzpOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `svdke_${Date.now()}`,
      notes: {
        user_id:  req.user.id,
        shop:     'Sri Vijaya Durga Kadi Emporium',
        address:  `${address.address_line1}, ${address.city}`,
      },
    })

    // ── Save pending order in DB ─────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.user.id,
        status:           'pending',
        payment_status:   'pending',
        payment_method:   'razorpay',
        subtotal,
        discount_amount:  discountAmount,
        points_used:      usablePoints,
        points_value:     pointsValue,
        shipping_charge:  shippingCharge,
        total_amount:     totalAmount,
        coupon_id:        couponId,
        address_id:       address.id,
        address_snapshot: address,
        notes:            JSON.stringify({ razorpay_order_id: rzpOrder.id }),
      })
      .select()
      .single()

    if (orderErr) {
      console.error('Order insert error:', orderErr)
      return res.status(500).json({ success: false, message: 'Failed to create order' })
    }

    // ── Save order items ─────────────────────────────────────
    const orderItems = validatedItems.map(item => ({
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

    return res.json({
      success: true,
      razorpay_order_id: rzpOrder.id,
      order_id:          order.id,
      amount:            amountInPaise,
      currency:          'INR',
      key_id:            process.env.RAZORPAY_KEY_ID,
      order_number:      order.order_number,
      prefill: {
        name:    profile?.full_name || '',
        email:   req.user.email,
        contact: address.phone,
      },
      address,
      subtotal,
      discount_amount:  discountAmount,
      points_value:     pointsValue,
      shipping_charge:  shippingCharge,
      total_amount:     totalAmount,
    })
  } catch (err) {
    console.error('create-order error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/payments/verify ─────────────────────────────────
// Called after successful Razorpay payment — verifies signature & confirms order
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body

    // Verify signature
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      // Mark payment as failed
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'pending' })
        .eq('id', order_id)
      return res.status(400).json({ success: false, message: 'Payment verification failed' })
    }

    // ── Payment verified — update order ──────────────────────
    const { data: order } = await supabase
      .from('orders')
      .update({
        status:           'confirmed',
        payment_status:   'paid',
        notes: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .eq('user_id', req.user.id)
      .select('*, order_items(*)')
      .single()

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    // ── Deduct stock ─────────────────────────────────────────
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order_id)

    for (const item of items || []) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity:   item.quantity,
      }).catch(() => null) // graceful fail if rpc not exists
    }

    // ── Award reward points (₹100 = 10 pts) ─────────────────
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

    // ── Deduct used points ───────────────────────────────────
    if (order.points_used > 0) {
      await supabase.from('reward_points').insert({
        user_id:     req.user.id,
        points:      -order.points_used,
        type:        'redeemed',
        description: `Redeemed for order ${order.order_number}`,
        order_id:    order.id,
      })
    }

    // ── Clear user cart ──────────────────────────────────────
    await supabase.from('carts').delete().eq('user_id', req.user.id)

    // ── Increment coupon usage ───────────────────────────────
    if (order.coupon_id) {
      await supabase.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id }).catch(() => null)
    }

    // ── Notification ─────────────────────────────────────────
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title:   '🎉 Order Confirmed!',
      message: `Your order ${order.order_number} has been placed successfully.`,
      type:    'order',
      link:    `/orders/${order.id}`,
    })

    return res.json({
      success:       true,
      message:       'Payment verified successfully',
      order_id:      order.id,
      order_number:  order.order_number,
      points_earned: pointsEarned,
    })
  } catch (err) {
    console.error('verify error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/payments/retry ──────────────────────────────────
// Retry failed payment — fetches stored order details
router.post('/retry/:order_id', auth, async (req, res) => {
  try {
    const { order_id } = req.params

    // Fetch the failed order with all stored details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, images, price, discount_price))')
      .eq('id', order_id)
      .eq('user_id', req.user.id)
      .in('payment_status', ['pending', 'failed'])
      .single()

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found or already paid' })
    }

    // Create new Razorpay order with SAME amount
    const amountInPaise = Math.round(order.total_amount * 100)
    const rzpOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `retry_${Date.now()}`,
      notes: {
        original_order_id: order.id,
        order_number:      order.order_number,
        user_id:           req.user.id,
      },
    })

    // Update order with new razorpay order id
    await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        notes: JSON.stringify({ razorpay_order_id: rzpOrder.id, retry: true }),
      })
      .eq('id', order_id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single()

    return res.json({
      success:           true,
      razorpay_order_id: rzpOrder.id,
      order_id:          order.id,
      order_number:      order.order_number,
      amount:            amountInPaise,
      currency:          'INR',
      key_id:            process.env.RAZORPAY_KEY_ID,
      total_amount:      order.total_amount,
      subtotal:          order.subtotal,
      discount_amount:   order.discount_amount,
      shipping_charge:   order.shipping_charge,
      address:           order.address_snapshot,
      items:             order.order_items,
      prefill: {
        name:    profile?.full_name || '',
        email:   req.user.email,
        contact: order.address_snapshot?.phone || '',
      },
    })
  } catch (err) {
    console.error('retry error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/payments/failure ────────────────────────────────
// Mark order payment as failed
router.post('/failure', auth, async (req, res) => {
  try {
    const { order_id, razorpay_order_id, error_description } = req.body

    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        notes: JSON.stringify({ razorpay_order_id, error: error_description }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .eq('user_id', req.user.id)

    // Fetch order details for retry page
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, images, price, discount_price))')
      .eq('id', order_id)
      .single()

    return res.json({
      success:      true,
      message:      'Payment failure recorded',
      order_id,
      order_number: order?.order_number,
      total_amount: order?.total_amount,
      address:      order?.address_snapshot,
      items:        order?.order_items,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/payments/key ─────────────────────────────────────
router.get('/key', (_req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID })
})

module.exports = router
