import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import store from '../../store'
import { setUser, setProfile, setLoading } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd]   = useState(false)
  const [loginLoading, setLoginLoading]   = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [shake, setShake]       = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoginLoading(true)
    setLoginErr('')
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // Map common error messages to friendly text
        const msg = error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message === 'Email not confirmed'
          ? 'Please verify your email first, or contact support.'
          : error.message
        setLoginErr(msg)
        setShake(true)
        setTimeout(() => setShake(false), 600)
        return
      }

      if (authData?.user) {
        // Fetch full profile (needed for role check + Admin Panel)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        // ── Dispatch to Redux BEFORE navigate ──────────────────────
        // This ensures AdminRoute already sees user + isAdmin + loading=false
        // the instant it first renders, preventing the redirect-to-home bug.
        store.dispatch(setUser(authData.user))
        if (profile) store.dispatch(setProfile(profile))
        store.dispatch(setLoading(false))

        if (profile?.role === 'admin') {
          toast.success('Welcome to Admin Panel! 👑')
          navigate('/admin')
        } else {
          toast.success('Welcome back! 🎉')
          navigate('/')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setLoginErr(err.message || 'An unexpected error occurred. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error.message)
  }

  return (
    <motion.div
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-8"
    >
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400 text-sm">Sign in to your account</p>
      </div>

      {loginErr && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-accent-900/30 border border-accent-500/30 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
          <p className="text-accent-300 text-sm">{loginErr}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label text-gray-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input {...register('email')} type="email" placeholder="you@example.com"
              className={`input pl-11 bg-white/10 border-white/20 text-white placeholder-gray-500 ${errors.email ? 'input-error' : ''}`} />
          </div>
          {errors.email && <p className="text-accent-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label text-gray-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="••••••••"
              className={`input pl-11 pr-11 bg-white/10 border-white/20 text-white placeholder-gray-500 ${errors.password ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-accent-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loginLoading}
          className="btn-primary w-full justify-center py-3.5 text-base">
          {loginLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Sign In'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-transparent text-gray-500 text-sm">or continue with</span>
        </div>
      </div>

      <button onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-200">
        <FaGoogle className="w-5 h-5 text-red-400" />
        <span className="font-medium">Continue with Google</span>
      </button>

      <p className="text-center mt-6 text-gray-400 text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Sign up free
        </Link>
      </p>
    </motion.div>
  )
}
