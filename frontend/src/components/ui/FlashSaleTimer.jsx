import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

export default function FlashSaleTimer({ endTime }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date()
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0 }); return }
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endTime])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4 text-accent-500" />
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ends in:</span>
      <div className="flex items-center gap-1">
        {[pad(time.h), pad(time.m), pad(time.s)].map((unit, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-9 h-9 bg-dark-900 dark:bg-dark-700 text-primary-400 font-bold text-sm rounded-lg flex items-center justify-center font-mono shadow">
              {unit}
            </span>
            {i < 2 && <span className="text-primary-400 font-bold animate-pulse">:</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
