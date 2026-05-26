import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-dark-900">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-700/10 rounded-full blur-3xl" />
      </div>
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <div className="flex items-center gap-3 justify-center">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white p-1" />
              <div className="text-left">
                <p className="text-white font-display font-bold text-xl leading-tight">srivijaydurgakadhiemporeum</p>
              </div>
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md">
          <Outlet />
        </motion.div>
        <p className="mt-8 text-gray-500 text-sm text-center">
          © 2024 srivijaydurgakadhiemporeum, Arundelpet, Guntur
        </p>
      </div>
    </div>
  )
}
