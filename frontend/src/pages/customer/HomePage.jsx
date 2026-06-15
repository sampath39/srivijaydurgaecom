import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Star, Gift, Users, ShoppingBag, Truck, Shield, MapPin, Phone, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ProductCard from '../../components/ui/ProductCard'
import FlashSaleTimer from '../../components/ui/FlashSaleTimer'
import SkeletonCard from '../../components/ui/SkeletonCard'
import { useSelector } from 'react-redux'
import { CATEGORY_COLORS, PRETTY_NAMES, FALLBACK_COLOR } from '../../lib/taxonomy'

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
]

const FEATURES = [
  { icon: Truck,    title: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: Shield,   title: 'Quality Assured', desc: '100% Original Products' },
  { icon: ShoppingBag, title: 'Easy Returns', desc: 'Within 7 Days' },
  { icon: Phone,     title: 'Customer Support', desc: '24/7 Support' },
]

const SIDEBAR_CATS = [
  { slug: 'towels', icon: '🧻' },
  { slug: 'pillows', icon: '🛏️' },
  { slug: 'shirts', icon: '👔' },
  { slug: 'pants', icon: '👖' },
  { slug: 't-shirts', icon: '👕' },
  { slug: 'jeans', icon: '👖' },
  { slug: 'sarees', icon: '🥻' },
  { slug: 'kurtas', icon: '👘' },
  { slug: 'bedsheets', icon: '🛏️' },
  { slug: 'blankets', icon: '🛌' },
  { slug: 'curtains', icon: '🏡' },
  { slug: 'home-decor', icon: '🏺' },
  { slug: 'kitchen', icon: '🍳' },
  { slug: 'ayurvedic', icon: '🌿' },
  { slug: 'innerwear', icon: '🩲' },
  { slug: 'bottles', icon: '💧' },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide]   = useState(0)
  const [featuredProducts, setFeatured]   = useState([])
  const [flashProducts, setFlash]         = useState([])
  const [loadingFeatured, setLF]          = useState(true)

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
      })
  }, [])

  const slide = HERO_SLIDES[currentSlide]

  return (
    <div className="page-container py-8 flex flex-col lg:flex-row gap-8">
      {/* ── Left Sidebar (Categories) ──────────────────── */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-4 pb-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-4 px-3">BROWSE CATEGORIES</h3>
          <nav className="space-y-0.5">
            {SIDEBAR_CATS.map(cat => (
              <Link 
                key={cat.slug} 
                to={`/products?category=${cat.slug}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 transition-colors group"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-lg opacity-80">{cat.icon}</span> 
                  {PRETTY_NAMES[cat.slug] || cat.slug}
                </div>
                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:text-primary-600 transition-all" />
              </Link>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 pb-2">
            <Link to="/products" className="w-full btn-outline py-2 text-sm text-primary-600 bg-primary-50 dark:bg-primary-900/10 border-transparent hover:border-primary-200">
              View All Categories
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────── */}
      <div className="flex-1 w-full min-w-0 space-y-10">
        
        {/* ── Hero Banner ───────────────────────────────── */}
        <section className="relative h-[400px] md:h-[450px] rounded-3xl overflow-hidden shadow-sm">
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

          <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl"
            >
              <span className="inline-block badge-gold mb-4 text-sm px-4 py-1.5">
                {slide.badge}
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight whitespace-pre-line mb-4 text-shadow">
                {slide.title}
              </h1>
              <p className="text-white/90 text-lg mb-8 max-w-lg">{slide.subtitle}</p>
              <Link to={slide.link} className="btn-primary text-lg px-8 py-3.5 shadow-gold-lg">
                {slide.cta} <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Shop by Category (Screenshot Layout) ──────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All Categories</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {SIDEBAR_CATS.map((cat, i) => {
              const bgColor = CATEGORY_COLORS[cat.slug] || FALLBACK_COLOR;
              return (
                <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="group block">
                  <div className={`w-full aspect-[4/3] rounded-2xl ${bgColor} flex flex-col items-center justify-center p-4 transition-transform group-hover:scale-[1.02] shadow-sm`}>
                    <span className="text-4xl mb-3 drop-shadow-md transition-transform group-hover:-translate-y-1">{cat.icon}</span>
                    <span className="text-sm font-semibold text-gray-800 text-center">{PRETTY_NAMES[cat.slug] || cat.slug}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Features strip ────────────────────────────── */}
        <section className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-2 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-dark-700">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors first:rounded-l-xl last:rounded-r-xl">
                <f.icon className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{f.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Best Selling Products ─────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Best Selling Products</h2>
            <Link to="/products?sort=popular" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loadingFeatured
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.slice(0, 5).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </section>
        
        <div className="pb-12" />
      </div>
    </div>
  )
}
