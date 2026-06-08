import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, Eye, EyeOff, Gift } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'
import { supabase, getRedirectUrl } from '../../lib/supabase'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:         z.string().email('Enter a valid email'),
  phone:         z.string().min(10, 'Enter valid phone number').optional().or(z.literal('')),
  password:      z.string().min(6, 'Password must be at least 6 characters'),
  confirm:       z.string(),
  referral_code: z.string().optional().or(z.literal('')),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, phone: data.phone },
          emailRedirectTo: getRedirectUrl('/login'),
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        // Apply referral if provided
        if (data.referral_code && authData.user) {
          await fetch(`${import.meta.env.VITE_API_URL}/referrals/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referral_code: data.referral_code }),
          }).catch(() => null)
        }
        toast.success('Account created! Please check your email to verify.')
        navigate('/login')
      }
    } catch (err) {
      console.error("Signup exception:", err)
      toast.error(err.message || 'An unexpected error occurred during signup.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    })
    if (error) toast.error(error.message)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm">Join us and start shopping!</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'full_name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Sampath Kumar' },
          { name: 'email',     label: 'Email',     icon: Mail, type: 'email', placeholder: 'you@example.com' },
          { name: 'phone',     label: 'Phone (optional)', icon: Phone, type: 'tel', placeholder: '+91 9876543210' },
        ].map(field => (
          <div key={field.name}>
            <label className="label text-gray-300">{field.label}</label>
            <div className="relative">
              <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input {...register(field.name)} type={field.type} placeholder={field.placeholder}
                className={`input pl-11 bg-white/10 border-white/20 text-white placeholder-gray-500 ${errors[field.name] ? 'input-error' : ''}`} />
            </div>
            {errors[field.name] && <p className="text-accent-400 text-xs mt-1">{errors[field.name].message}</p>}
          </div>
        ))}

        <div>
          <label className="label text-gray-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters"
              className={`input pl-11 pr-11 bg-white/10 border-white/20 text-white placeholder-gray-500 ${errors.password ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-accent-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label text-gray-300">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input {...register('confirm')} type="password" placeholder="Re-enter password"
              className={`input pl-11 bg-white/10 border-white/20 text-white placeholder-gray-500 ${errors.confirm ? 'input-error' : ''}`} />
          </div>
          {errors.confirm && <p className="text-accent-400 text-xs mt-1">{errors.confirm.message}</p>}
        </div>

        <div>
          <label className="label text-gray-300 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary-400" /> Referral Code (optional)
          </label>
          <input {...register('referral_code')} type="text" placeholder="Enter referral code for bonus points"
            className="input bg-white/10 border-white/20 text-white placeholder-gray-500 uppercase" />
          <p className="text-xs text-primary-400 mt-1">🎁 Get 50 bonus points with a valid referral code!</p>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full justify-center py-3.5 text-base mt-2">
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
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
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
      </p>
    </motion.div>
  )
}
