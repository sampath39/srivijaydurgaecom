import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error("Passwords don't match"); return }
    if (password.length < 6) { toast.error('Password too short'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else { setDone(true); setTimeout(() => navigate('/login'), 2500) }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8">
      {done ? (
        <div className="text-center py-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-white">Password Updated!</h2>
          <p className="text-gray-400 text-sm mt-2">Redirecting to login...</p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm mb-8">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'New Password', val: password, setter: setPassword },
              { label: 'Confirm Password', val: confirm, setter: setConfirm },
            ].map(f => (
              <div key={f.label}>
                <label className="label text-gray-300">{f.label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPwd ? 'text' : 'password'} value={f.val} onChange={e => f.setter(e.target.value)}
                    placeholder="••••••••" required
                    className="input pl-11 pr-11 bg-white/10 border-white/20 text-white placeholder-gray-500" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}
