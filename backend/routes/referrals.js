const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/referrals/my-code
router.get('/my-code', auth, async (req, res) => {
  try {
    const { data: profile } = await supabase.from('profiles')
      .select('referral_code, reward_points').eq('id', req.user.id).single()
    const { data: referrals } = await supabase.from('referrals')
      .select('*, profiles!referred_id(full_name, email, created_at)')
      .eq('referrer_id', req.user.id)
    res.json({ success: true, referral_code: profile?.referral_code, referrals, total_earned: referrals?.reduce((s,r) => s + r.points_awarded, 0) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/referrals/apply
router.post('/apply', auth, async (req, res) => {
  try {
    const { referral_code } = req.body
    const { data: referrer } = await supabase.from('profiles')
      .select('id').eq('referral_code', referral_code.toUpperCase()).neq('id', req.user.id).single()
    if (!referrer) return res.status(404).json({ success: false, message: 'Invalid referral code' })

    const { data: existing } = await supabase.from('referrals')
      .select('id').eq('referred_id', req.user.id).single()
    if (existing) return res.status(400).json({ success: false, message: 'Referral already applied' })

    await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: req.user.id, status: 'completed', points_awarded: 100 })
    await supabase.from('reward_points').insert([
      { user_id: referrer.id, points: 100, type: 'referral', description: 'Friend joined via your referral!' },
      { user_id: req.user.id, points: 50, type: 'referral', description: 'Welcome bonus for joining via referral!' },
    ])
    await supabase.from('profiles').update({ reward_points: supabase.raw('reward_points + 100') }).eq('id', referrer.id)
    await supabase.from('profiles').update({ reward_points: supabase.raw('reward_points + 50'), referred_by: referrer.id }).eq('id', req.user.id)

    res.json({ success: true, message: 'Referral applied! You earned 50 bonus points 🎉' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
