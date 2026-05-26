import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Zap, Star, Calendar, CheckCircle, Clock, Trophy, ArrowRight } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { setProfile } from '../../store/slices/authSlice'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'


export default function RewardsPage() {
  const profile  = useSelector(s => s.auth.profile)
  const [balance, setBalance]   = useState(profile?.reward_points || 0)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)


  useEffect(() => {
    api.get('/rewards/balance').then(({ data }) => {
      setBalance(data.points)
      setHistory(data.history || [])
      setLoading(false)
    })

  }, [])



  return (
    <div className="page-container py-10">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2">🏆 Rewards Center</h1>
        <p className="text-gray-500">Earn, spin, and redeem your way to amazing rewards!</p>
      </div>

      {/* Points balance */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-amber-600 rounded-3xl p-8 mb-8 text-white text-center shadow-gold-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-white/80" />
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Your Reward Balance</p>
          <motion.p key={balance} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
            className="font-display text-6xl font-bold my-2">{balance.toLocaleString('en-IN')}</motion.p>
          <p className="text-white/70 text-sm">points = ₹{(balance * 0.01).toFixed(2)} value</p>
        </div>
      </motion.div>


      {/* Points history */}
      <div className="card p-6">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" /> Points History
        </h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No points history yet. Start shopping!</p>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-dark-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{h.description}</p>
                  <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`font-bold text-base ${h.points > 0 ? 'text-green-600' : 'text-accent-600'}`}>
                  {h.points > 0 ? '+' : ''}{h.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="mt-8 card p-6">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-5">How to Earn Points</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon:'🛍️', title:'Every Purchase', desc:'₹100 = 10 points' },
            { icon:'👥', title:'Refer Friends', desc:'100 pts per referral' },
          ].map(card => (
            <div key={card.title} className="text-center p-4 bg-gray-50 dark:bg-dark-700 rounded-2xl">
              <div className="text-3xl mb-2">{card.icon}</div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{card.title}</p>
              <p className="text-gray-500 text-xs mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
