const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/rewards/balance
router.get('/balance', auth, async (req, res) => {
  try {
    const { data: profile } = await supabase.from('profiles')
      .select('reward_points').eq('id', req.user.id).single()
    const { data: history } = await supabase.from('reward_points')
      .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(20)
    res.json({ success: true, points: profile?.reward_points || 0, history })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/rewards/spin — Spin wheel (once per day)
router.post('/spin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase.from('spin_wheel_history')
      .select('id').eq('user_id', req.user.id).eq('spin_date', today).single()
    if (existing) return res.status(400).json({ success: false, message: 'Already spun today! Come back tomorrow.' })

    // Weighted random rewards
    const rewards = [
      { type: 'points', value: '10', label: '10 Points', weight: 30 },
      { type: 'points', value: '25', label: '25 Points', weight: 20 },
      { type: 'points', value: '50', label: '50 Points', weight: 10 },
      { type: 'coupon', value: 'SPIN10', label: '10% Off', weight: 15 },
      { type: 'coupon', value: 'SPIN20', label: '20% Off', weight: 8 },
      { type: 'discount', value: '5', label: '₹5 Off', weight: 12 },
      { type: 'nothing', value: '0', label: 'Better luck next time', weight: 5 },
    ]
    const totalWeight = rewards.reduce((s, r) => s + r.weight, 0)
    let rand = Math.random() * totalWeight
    let selected = rewards[rewards.length - 1]
    for (const r of rewards) {
      rand -= r.weight
      if (rand <= 0) { selected = r; break }
    }

    await supabase.from('spin_wheel_history').insert({
      user_id: req.user.id, spin_date: today, reward_type: selected.type, reward_value: selected.value
    })

    if (selected.type === 'points') {
      const pts = parseInt(selected.value)
      await supabase.from('reward_points').insert({
        user_id: req.user.id, points: pts, type: 'spin', description: `Spin wheel reward`
      })
      await supabase.rpc('increment_points', {
        p_user_id: req.user.id,
        p_points:  pts
      }).catch(() => null)
    }

    if (selected.type === 'coupon') {
      const pctValue = selected.value === 'SPIN20' ? 20 : 10
      // Ensure coupon exists or create one
      await supabase.from('coupons').upsert({
        code: selected.value, type: 'percentage', value: pctValue,
        min_order_value: 0, usage_limit: 1000, is_active: true
      }, { onConflict: 'code' })
    }

    res.json({ success: true, reward: selected })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
