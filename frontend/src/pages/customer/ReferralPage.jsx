import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Share2, Gift, CheckCircle, ArrowRight } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const profile   = useSelector(s => s.auth.profile)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/referrals/my-code').then(({ d }) => {
      // Fallback to profile referral_code if API fails
      setData({ referral_code: profile?.referral_code, referrals: [], total_earned: 0 })
      setLoading(false)
    }).catch(() => {
      setData({ referral_code: profile?.referral_code, referrals: [], total_earned: 0 })
      setLoading(false)
    })
  }, [])

  const shareLink = `${window.location.origin}/signup?ref=${data?.referral_code || ''}`

  const copyCode = () => {
    navigator.clipboard.writeText(data?.referral_code || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareApp = () => {
    if (navigator.share) {
      navigator.share({ title: 'Sri Vijaya Durga Kadi Emporium', text: `Use my referral code ${data?.referral_code} for 50 bonus points!`, url: shareLink })
    } else {
      navigator.clipboard.writeText(shareLink)
      toast.success('Share link copied!')
    }
  }

  return (
    <div className="page-container py-10">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2">👥 Refer & Earn</h1>
        <p className="text-gray-500 max-w-lg mx-auto">Invite friends to Sri Vijaya Durga Kadi Emporium and earn reward points for every successful referral!</p>
      </div>

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        {[
          { step:'01', icon:'📤', title:'Share Your Code', desc:'Send your unique referral code to friends & family' },
          { step:'02', icon:'📝', title:'Friend Signs Up', desc:'Your friend creates an account using your code' },
          { step:'03', icon:'🏆', title:'Both Earn Points', desc:'You get 100 pts, they get 50 pts as welcome bonus!' },
        ].map((step, i) => (
          <motion.div key={step.step}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card p-6 text-center relative overflow-hidden">
            <div className="absolute top-3 right-3 text-4xl font-bold text-gray-100 dark:text-dark-700 font-display">{step.step}</div>
            <div className="text-4xl mb-3 relative z-10">{step.icon}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
            <p className="text-gray-500 text-sm">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral code card */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 rounded-3xl p-8 text-center mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10">
          <Users className="w-12 h-12 mx-auto mb-4 text-white/80" />
          <p className="text-white/70 text-sm uppercase tracking-widest mb-2">Your Referral Code</p>
          <div className="inline-flex items-center gap-3 bg-white/10 border-2 border-white/30 rounded-2xl px-6 py-3 mb-6">
            <span className="font-mono font-bold text-3xl tracking-widest text-primary-300">
              {loading ? '......' : (data?.referral_code || 'NO CODE')}
            </span>
            <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
              {copied ? <CheckCircle className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={copyCode} className="btn-primary py-3 px-8">
              <Copy className="w-4 h-4" /> Copy Code
            </button>
            <button onClick={shareApp} className="flex items-center gap-2 px-8 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
              <Share2 className="w-4 h-4" /> Share Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label:'Total Referrals', value: data?.referrals?.length || 0, icon:'👥', color:'text-blue-600' },
          { label:'Points Earned', value: data?.total_earned || 0, icon:'🏆', color:'text-primary-600' },
          { label:'Your Points', value: profile?.reward_points || 0, icon:'💎', color:'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString('en-IN')}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral list */}
      <div className="card p-6">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-4">Your Referrals</h2>
        {(data?.referrals || []).length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-200 dark:text-dark-600 mx-auto mb-3" />
            <p className="text-gray-400">No referrals yet. Share your code to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.referrals || []).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {r.profiles?.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{r.profiles?.full_name || 'Friend'}</p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-green-600 font-bold text-sm">+{r.points_awarded} pts</span>
                  <p className="text-xs text-gray-400 capitalize">{r.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
