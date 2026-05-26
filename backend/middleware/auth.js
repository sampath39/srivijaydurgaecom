const supabase = require('../lib/supabase')

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }

    // Fetch profile for role info
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, reward_points')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      // Self-heal: Create profile record if missing
      const fullName = user.user_metadata?.full_name || user.email.split('@')[0]
      const phone = user.user_metadata?.phone || ''
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          phone: phone,
          role: 'customer'
        })
        .select()
        .maybeSingle()

      if (!createError && newProfile) {
        profile = newProfile
      }
    }

    req.user    = user
    req.profile = profile
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' })
  }
}
