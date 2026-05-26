import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Star, Gift, Users, ShoppingBag, Truck, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ProductCard from '../../components/ui/ProductCard'
import FlashSaleTimer from '../../components/ui/FlashSaleTimer'
import SkeletonCard from '../../components/ui/SkeletonCard'
import { useSelector } from 'react-redux'

const HERO_SLIDES = [
  {
    title: 'Authentic Kadi\nTextiles of India',
    subtitle: 'Handspun. Handwoven. Handcrafted with love.',
    cta: 'Explore Collection',
    link: '/products',
    gradient: 'from-amber-900/90 via-primary-900/80 to-dark-900/90',
    bg: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&q=80',
    badge: '🏆 25+ Years of Trust',
  },
  {
    title: 'Silk Sarees &\nDress Materials',
    subtitle: 'Premium quality, authentic designs from Guntur.',
    cta: 'Shop Sarees',
    link: '/products?category=sarees',
    gradient: 'from-secondary-900/90 via-purple-900/80 to-dark-900/90',
    bg: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1400&q=80',
    badge: '✨ New Arrivals',
  },
  {
    title: 'Flash Sale Live!\nUp to 40% Off',
    subtitle: 'Limited time offers on premium Kadi fabrics.',
    cta: 'Grab Deals',
    link: '/products?flash_sale=true',
    gradient: 'from-accent-900/90 via-orange-900/80 to-dark-900/90',
    bg: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=80',
    badge: '⚡ Flash Sale',
  },
]

const CATEGORIES = [
  { name: 'Sarees', slug: 'sarees', icon: '🥻', color: 'from-pink-400 to-rose-600', count: '200+ styles' },
  { name: 'Kadi Fabrics', slug: 'kadi-fabrics', icon: '🧵', color: 'from-amber-400 to-orange-600', count: '150+ types' },
  { name: 'Dress Materials', slug: 'dress-materials', icon: '👗', color: 'from-purple-400 to-indigo-600', count: '300+ sets' },
  { name: 'Dupattas', slug: 'dupattas', icon: '🧣', color: 'from-teal-400 to-cyan-600', count: '100+ designs' },
  { name: 'Kurtas & Sets', slug: 'kurtas-sets', icon: '👔', color: 'from-blue-400 to-blue-600', count: '80+ styles' },
  { name: 'Bedsheets', slug: 'bedsheets', icon: '🛏️', color: 'from-green-400 to-emerald-600', count: '60+ sets' },
  { name: 'Towels', slug: 'towels', icon: '🧺', color: 'from-yellow-400 to-amber-600', count: '40+ types' },
  { name: 'Accessories', slug: 'accessories', icon: '👜', color: 'from-red-400 to-pink-600', count: '50+ items' },
]

const FEATURES = [
  { icon: Truck,    title: 'Free Shipping', desc: 'On orders above ₹999', color: 'text-blue-500' },
  { icon: Shield,   title: '100% Authentic', desc: 'Genuine kadi products', color: 'text-green-500' },
  { icon: Star,     title: 'Quality Assured', desc: '25+ years of trust', color: 'text-primary-500' },
  { icon: Gift,     title: 'Rewards & Offers', desc: 'Earn points on purchase', color: 'text-purple-500' },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide]   = useState(0)
  const [featuredProducts, setFeatured]   = useState([])
  const [flashProducts, setFlash]         = useState([])
  const [loadingFeatured, setLF]          = useState(true)
  const [loadingFlash, setLFlash]         = useState(true)
  const profile = useSelector(s => s.auth.profile)

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.from('products').select('*, categories(name,slug)')
      .eq('is_active', true).eq('is_featured', true).limit(8)
      .then(({ data, error }) => {
        if (error) console.error("Supabase error featured products:", error)
        setFeatured(data || [])
        setLF(false)
      })

    supabase.from('products').select('*, categories(name,slug)')
      .eq('is_active', true).eq('is_flash_sale', true).limit(4)
      .then(({ data, error }) => {
        if (error) console.error("Supabase error flash sale products:", error)
        setFlash(data || [])
        setLFlash(false)
      })
  }, [])

  const slide = HERO_SLIDES[currentSlide]

  return (
    <div className="min-h-screen">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <section className="relative h-[75vh] min-h-[500px] overflow-hidden">
        {HERO_SLIDES.map((s, i) => (
          <motion.div key={i}
            initial={false}
            animate={{ opacity: i === currentSlide ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={s.bg} alt="" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
          </motion.div>
        ))}

        <div className="relative z-10 h-full flex items-center">
          <div className="page-container">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="inline-block badge-gold mb-4 text-sm px-4 py-1.5">
                {slide.badge}
              </motion.span>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight whitespace-pre-line mb-4 text-shadow">
                {slide.title}
              </h1>
              <p className="text-white/80 text-xl mb-8 max-w-lg">{slide.subtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link to={slide.link} className="btn-primary text-lg px-8 py-4 shadow-gold-lg">
                  {slide.cta} <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/products" className="flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                  View All
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-primary-400' : 'w-2 bg-white/40'}`} />
          ))}
        </div>

        {/* Floating stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="absolute bottom-8 right-8 hidden lg:flex flex-col gap-2">
          {[['10K+', 'Happy Customers'], ['500+', 'Products'], ['25+', 'Years of Trust']].map(([num, label]) => (
            <div key={label} className="glass px-4 py-2 rounded-xl text-right">
              <p className="font-bold text-primary-400 text-lg">{num}</p>
              <p className="text-white/70 text-xs">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features strip ──────────────────────────────── */}
      <section className="bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-dark-700">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="flex items-center gap-3 px-4 py-5 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-600 flex items-center justify-center ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{f.title}</p>
                  <p className="text-gray-400 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────── */}
      <section className="py-16">
        <div className="page-container">
          <div className="text-center mb-10">
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="section-title">Shop by Category</motion.h2>
            <div className="gold-divider mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.slug}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Link to={`/products?category=${cat.slug}`}
                  className="block text-center group">
                  <div className={`w-full aspect-square bg-gradient-to-br ${cat.color} rounded-2xl flex items-center justify-center text-4xl mb-2 shadow-md group-hover:shadow-lg transition-all duration-300`}>
                    {cat.icon}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{cat.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{cat.count}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flash Sale ──────────────────────────────────── */}
      {flashProducts.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-accent-900/20 via-primary-900/10 to-dark-900/20 dark:from-accent-900/30">
          <div className="page-container">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center animate-pulse">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="section-title text-2xl md:text-3xl">⚡ Flash Sale</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Hurry! Limited time offers</p>
              </div>
              <FlashSaleTimer endTime={new Date(Date.now() + 6 * 60 * 60 * 1000)} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            <div className="text-center mt-6">
              <Link to="/products?flash_sale=true" className="btn-outline">
                View All Flash Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ────────────────────────────── */}
      <section className="py-16">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="section-title">Trending Products</h2>
              <div className="gold-divider mt-3" />
            </div>
            <Link to="/products?featured=true" className="btn-outline text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loadingFeatured
              ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* ── Referral Banner ─────────────────────────────── */}
      <section className="py-12">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden bg-gradient-to-r from-secondary-900 via-secondary-800 to-primary-900 rounded-3xl p-8 md:p-12">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge-gold px-3 py-1">Referral Program</span>
                </div>
                <h3 className="font-display text-3xl font-bold text-white mb-2">Invite & Earn ₹50!</h3>
                <p className="text-white/70 text-base max-w-lg">
                  Share your referral code with friends. When they join and shop, you earn <strong className="text-primary-400">100 reward points</strong> and they get <strong className="text-primary-400">50 bonus points</strong>!
                </p>
              </div>
              <div className="shrink-0">
                <Link to={profile ? '/referral' : '/signup'} className="btn-primary text-lg px-8 py-4 shadow-gold-lg">
                  <Gift className="w-5 h-5" />
                  {profile ? 'My Referral Code' : 'Join & Earn'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Rewards Banner ──────────────────────────────── */}
      <section className="py-12 bg-gray-50 dark:bg-dark-800">
        <div className="page-container">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏆', title: 'Earn Points', desc: '₹100 purchase = 10 reward points', link: '/rewards', color: 'from-primary-500 to-amber-600' },
            ].map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Link to={card.link}
                  className={`block bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
                  <div className="text-4xl mb-3">{card.icon}</div>
                  <h3 className="font-bold text-xl mb-1">{card.title}</h3>
                  <p className="text-white/80 text-sm">{card.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop Info ────────────────────────────────────── */}
      <section className="py-16">
        <div className="page-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="section-title mb-4">Visit Our Store</h2>
            <div className="gold-divider mx-auto mb-6" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Experience the finest kadi textiles in person at our flagship store in Guntur.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
              <a href="tel:9493447776" className="btn-primary px-8 py-3">
                📞 Call 9493447776
              </a>
              <a href="https://maps.google.com/?q=Arundelpet,Guntur" target="_blank" rel="noreferrer"
                className="btn-outline px-8 py-3">
                📍 Arundelpet 4/1, Guntur
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
