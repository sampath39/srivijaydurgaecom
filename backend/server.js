const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const dotenv     = require('dotenv')
const rateLimit  = require('express-rate-limit')
const compression = require('compression')

dotenv.config()

const app = express()

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())
app.use(morgan('dev'))
// CORS: allow Vercel frontend + localhost dev
const allowedOrigins = [
  'https://srivijaydurgaecom-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, Razorpay webhooks)
    if (!origin) return callback(null, true)
    // Allow any vercel.app subdomain or any configured allowed origin
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

// Body parsing  (raw for Razorpay webhook, json for everything else)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/products',   require('./routes/products'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/cart',       require('./routes/cart'))
app.use('/api/orders',     require('./routes/orders'))
app.use('/api/wishlist',   require('./routes/wishlist'))
app.use('/api/reviews',    require('./routes/reviews'))
app.use('/api/coupons',    require('./routes/coupons'))
app.use('/api/rewards',    require('./routes/rewards'))
app.use('/api/referrals',  require('./routes/referrals'))
app.use('/api/payments',   require('./routes/payments'))
app.use('/api/admin',      require('./routes/admin'))
app.use('/api/addresses',  require('./routes/addresses'))
app.use('/api/pos',        require('./routes/pos'))

// ── Root route ───────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  success: true,
  message: `Welcome to ${process.env.APP_NAME || 'Sri Vijaya Durga Kadi Emporium'} API`,
  health: '/health'
}))

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'OK',
  app: process.env.APP_NAME,
  time: new Date().toISOString(),
  deployed_at: '2026-06-01T12:08:00Z',
  version: 'v_simulation_fallback_fixed'
}))

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Sri Vijaya Durga Kadi Emporium API running on port ${PORT}`)
})
