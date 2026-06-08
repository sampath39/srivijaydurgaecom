import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase, getRedirectUrl } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('/reset-password'),
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8">
      {sent ? (
        <div className="text-center py-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Check your email!</h2>
          <p className="text-gray-400 text-sm mb-6">We sent a reset link to <span className="text-white font-medium">{email}</span></p>
          <Link to="/login" className="btn-primary w-full justify-center">Back to Login</Link>
        </div>
      ) : (
        <>
          <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400 text-sm mb-8">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="input pl-11 bg-white/10 border-white/20 text-white placeholder-gray-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}
