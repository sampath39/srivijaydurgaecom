module.exports = function adminOnly(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
}
