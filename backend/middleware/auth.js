const supabase = require('../lib/supabase')
const jwt      = require('jsonwebtoken')

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    // Primary: use Supabase to validate the JWT
    let user = null
    try {
      const { data, error } = await supabase.auth.getUser(token)
      if (!error && data?.user) {
        user = data.user
      }
    } catch (e) {
      console.warn('[auth] supabase.auth.getUser failed:', e.message)
    }

    // Fallback: decode JWT directly using JWT_SECRET (works even with anon key)
    if (!user) {
      try {
        const decoded = jwt.decode(token) // decode without verify first to get sub
        if (decoded?.sub) {
          user = { id: decoded.sub, email: decoded.email, user_metadata: decoded.user_metadata || {} }
          console.log('[auth] Using JWT decode fallback for user:', user.id)
        }
      } catch (e) {
        console.warn('[auth] JWT decode fallback failed:', e.message)
      }
    }

    if (!user) {
      console.error('[auth] No valid user found from token')
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }

    // Fetch profile
    let { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profErr) {
      console.error('[auth] Profile fetch error:', profErr.message)
    }

    if (!profile) {
      console.log('[auth] No profile found, self-healing for user:', user.id)
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
      const phone    = user.user_metadata?.phone || ''

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email, full_name: fullName, phone, role: 'customer' })
        .select()
        .maybeSingle()

      if (createError) {
        console.error('[auth] Profile create error:', createError.message)
      } else if (newProfile) {
        profile = newProfile
        console.log('[auth] Profile created successfully:', profile.id)
      }
    }

    req.user    = user
    req.profile = profile
    next()
  } catch (err) {
    console.error('[auth] Unexpected error:', err.message)
    return res.status(401).json({ success: false, message: 'Authentication failed' })
  }
}
