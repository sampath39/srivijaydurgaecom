module.exports = function adminOnly(req, res, next) {
  const allowedRoles = ['admin', 'super_admin', 'support_agent', 'content_manager']
  if (!allowedRoles.includes(req.profile?.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
}
