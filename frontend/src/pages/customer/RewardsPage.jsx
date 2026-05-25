import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Zap, Star, Calendar, CheckCircle, Clock, Trophy, ArrowRight } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { setProfile } from '../../store/slices/authSlice'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const WHEEL_SEGMENTS = [
  { label: '10 Points', color: '#F59E0B', reward: { type: 'points', value: '10' } },
  { label: 'Better Luck', color: '#6B7280', reward: { type: 'nothing', value: '0' } },
  { label: '25 Points', color: '#4F46E5', reward: { type: 'points', value: '25' } },
  { label: '10% Off', color: '#DC2626', reward: { type: 'coupon', value: 'SPIN10' } },
  { label: '50 Points', color: '#059669', reward: { type: 'points', value: '50' } },
  { label: 'Better Luck', color: '#6B7280', reward: { type: 'nothing', value: '0' } },
  { label: '20% Off', color: '#7C3AED', reward: { type: 'coupon', value: 'SPIN20' } },
  { label: '₹5 Off', color: '#DB2777', reward: { type: 'discount', value: '5' } },
]

function SpinWheel({ onSpin, hasSpun }) {
  const canvasRef  = useRef(null)
  const [angle, setAngle]     = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult]   = useState(null)

  const draw = (ctx, rotation) => {
    const cx = 160, cy = 160, r = 155
    const sliceAngle = (2 * Math.PI) / WHEEL_SEGMENTS.length
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const start = rotation + i * sliceAngle
      const end   = start + sliceAngle
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px Inter'
      ctx.fillText(seg.label, r - 15, 5)
      ctx.restore()
    })
    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.fillStyle = '#F59E0B'
    ctx.font = 'bold 10px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('SPIN', cx, cy + 4)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    draw(ctx, angle)
  }, [angle])

  const spin = async () => {
    if (spinning || hasSpun) return
    setSpinning(true)
    try {
      const { data } = await api.post('/rewards/spin')
      const segIdx = WHEEL_SEGMENTS.findIndex(s => s.reward.type === data.reward.type && s.reward.value === data.reward.value)
      const sliceAngle = 360 / WHEEL_SEGMENTS.length
      const targetAngle = 360 * 5 + (360 - segIdx * sliceAngle - sliceAngle / 2)

      let start = null
      const duration = 4000
      const startAngle = angle
      const animate = (ts) => {
        if (!start) start = ts
        const progress = Math.min((ts - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 4)
        const curr = startAngle + targetAngle * ease
        setAngle(curr * Math.PI / 180)
        if (progress < 1) requestAnimationFrame(animate)
        else {
          setResult(data.reward)
          onSpin(data.reward)
          setSpinning(false)
        }
      }
      requestAnimationFrame(animate)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Spin failed')
      setSpinning(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0"
          style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '24px solid #F59E0B' }} />
        <canvas ref={canvasRef} width={320} height={320} className="rounded-full shadow-2xl" />
      </div>
      <button onClick={spin} disabled={spinning || hasSpun}
        className="mt-6 btn-primary px-10 py-3.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
        {spinning ? '🌀 Spinning...' : hasSpun ? '✅ Spun Today' : '🎰 Spin Now!'}
      </button>
      {hasSpun && !result && (
        <p className="text-gray-400 text-sm mt-2">Come back tomorrow for another spin!</p>
      )}
    </div>
  )
}

export default function RewardsPage() {
  const profile  = useSelector(s => s.auth.profile)
  const dispatch = useDispatch()
  const [balance, setBalance]   = useState(profile?.reward_points || 0)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [hasSpun, setHasSpun]   = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  const [streak, setStreak]     = useState(0)

  useEffect(() => {
    api.get('/rewards/balance').then(({ data }) => {
      setBalance(data.points)
      setHistory(data.history || [])
      setLoading(false)
    })
    // Check today's checkin
    const today = new Date().toISOString().split('T')[0]
    supabase.from('daily_checkins').select('id,streak_days').eq('user_id', profile?.id).eq('checkin_date', today).single()
      .then(({ data }) => { if (data) { setCheckedIn(true); setStreak(data.streak_days) } })
    // Check today's spin
    supabase.from('spin_wheel_history').select('id').eq('user_id', profile?.id).eq('spin_date', today).single()
      .then(({ data }) => { if (data) setHasSpun(true) })
  }, [])

  const handleCheckin = async () => {
    try {
      const { data } = await api.post('/rewards/checkin')
      setCheckedIn(true)
      setStreak(data.streak)
      setBalance(b => b + data.points_earned)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already checked in today')
      setCheckedIn(true)
    }
  }

  const handleSpin = (reward) => {
    setHasSpun(true)
    setSpinResult(reward)
    if (reward.type === 'points') {
      setBalance(b => b + parseInt(reward.value))
      toast.success(`🎉 You won ${reward.value} points!`)
    } else if (reward.type === 'coupon') {
      toast.success(`🎟️ You won coupon: ${reward.value}!`)
    } else if (reward.type === 'discount') {
      toast.success(`💰 You won ₹${reward.value} discount!`)
    } else {
      toast('Better luck tomorrow! 🍀')
    }
  }

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
          <p className="text-white/70 text-sm">points = ₹{(balance * 0.1).toFixed(2)} value</p>
          {streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
              <Zap className="w-4 h-4" /> {streak}-day streak bonus active!
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Daily check-in */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 text-center">
          <Calendar className="w-12 h-12 text-secondary-500 mx-auto mb-3" />
          <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-1">Daily Check-In</h2>
          {streak > 0 && <p className="text-primary-600 text-sm mb-3">🔥 {streak}-day streak!</p>}
          <p className="text-gray-500 text-sm mb-5">Login every day to earn bonus points. Longer streak = more points!</p>
          <div className="grid grid-cols-7 gap-1 mb-5">
            {Array.from({length:7}).map((_,i) => (
              <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i < streak % 7 ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                {i < streak % 7 ? '✓' : i+1}
              </div>
            ))}
          </div>
          <button onClick={handleCheckin} disabled={checkedIn}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed justify-center">
            {checkedIn ? <><CheckCircle className="w-4 h-4" /> Checked In Today!</> : <><Calendar className="w-4 h-4" /> Check In & Earn Points</>}
          </button>
        </motion.div>

        {/* Spin wheel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-6">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-1 text-center">🎰 Spin & Win</h2>
          <p className="text-gray-500 text-sm mb-4 text-center">Spin once daily to win points, coupons, or discounts!</p>
          <SpinWheel onSpin={handleSpin} hasSpun={hasSpun} />
          <AnimatePresence>
            {spinResult && spinResult.type !== 'nothing' && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                <p className="font-bold text-primary-700 dark:text-primary-400">
                  🎉 {spinResult.type === 'points' ? `+${spinResult.value} Points!` : spinResult.type === 'coupon' ? `Coupon: ${spinResult.value}` : `₹${spinResult.value} Off!`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

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
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon:'🛍️', title:'Every Purchase', desc:'₹100 = 10 points' },
            { icon:'📅', title:'Daily Check-In', desc:'5-25 pts/day' },
            { icon:'🎰', title:'Spin Wheel', desc:'Up to 50 pts daily' },
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
