import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star, MapPin, Phone } from 'lucide-react'

const SAREE_IMAGES = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&q=80',
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&q=80',
  'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300&q=80',
]

export default function ShopBanner() {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      rotateY: [0, 5, -5, 0],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
    })
  }, [controls])

  return (
    <section className="shop-banner-section">
      {/* Animated background particles */}
      <div className="shop-banner-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
          }} />
        ))}
      </div>

      <div className="shop-banner-inner">

        {/* ── Left: Goddess Durga + Floating Sarees ───── */}
        <motion.div
          className="shop-banner-left"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {/* 3D Durga image card */}
          <motion.div className="durga-card-3d" animate={controls}>
            <img
              src="/durga-banner.png"
              alt="Goddess Durga – Sri Vijaya Durga Kadhi Emporium"
              className="durga-img"
            />
            <div className="durga-glow" />
            <div className="durga-label">
              <span>🙏 Jai Maa Durga</span>
            </div>
          </motion.div>

          {/* Floating mini saree cards */}
          {SAREE_IMAGES.slice(0, 3).map((src, i) => (
            <motion.div
              key={i}
              className="floating-saree"
              style={{ '--i': i }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1, scale: 1,
                y: [0, -8, 0],
              }}
              transition={{
                opacity: { delay: 0.4 + i * 0.15, duration: 0.5 },
                scale:   { delay: 0.4 + i * 0.15, duration: 0.5 },
                y: { duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }
              }}
            >
              <img src={src} alt="Saree" />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Center: Shop Name & Brand Info ──────────── */}
        <motion.div
          className="shop-banner-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Divine glow top badge */}
          <motion.div
            className="divine-badge"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✦ Est. 1999 · Guntur's Finest ✦
          </motion.div>

          {/* 3D Shop Name */}
          <div className="shop-name-3d">
            <motion.h1
              className="shop-name-line1"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Sri Vijaya Durga
            </motion.h1>
            <motion.h2
              className="shop-name-line2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              Kadhi Emporium
            </motion.h2>
            <div className="shop-name-underline" />
          </div>

          {/* Tagline */}
          <motion.p
            className="shop-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            🥻 Authentic Handloom · Premium Silk Sarees · Kadi Fabrics
          </motion.p>

          {/* Star rating */}
          <motion.div
            className="shop-rating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="star-icon" fill="currentColor" />
            ))}
            <span>4.9 · 10,000+ Happy Customers</span>
          </motion.div>

          {/* Info pills */}
          <motion.div
            className="shop-info-pills"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <a href="tel:9493447776" className="info-pill">
              <Phone className="w-3.5 h-3.5" /> 9493447776
            </a>
            <a
              href="https://maps.google.com/?q=Arundelpet,Guntur"
              target="_blank" rel="noreferrer"
              className="info-pill"
            >
              <MapPin className="w-3.5 h-3.5" /> Arundelpet, Guntur
            </a>
            <span className="info-pill highlight">25+ Years of Trust</span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="shop-cta-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Link to="/products" className="shop-cta-primary">
              🛍️ Shop Now
            </Link>
            <Link to="/products?category=sarees" className="shop-cta-secondary">
              🥻 View Sarees
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Right: Saree Gallery ─────────────────────── */}
        <motion.div
          className="shop-banner-right"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="saree-gallery">
            {SAREE_IMAGES.map((src, i) => (
              <motion.div
                key={i}
                className="saree-gallery-item"
                style={{ '--delay': `${i * 0.12}s` }}
                initial={{ opacity: 0, scale: 0.8, rotateZ: i % 2 === 0 ? -5 : 5 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                whileHover={{ scale: 1.08, rotateZ: i % 2 === 0 ? -3 : 3, zIndex: 10 }}
              >
                <img src={src} alt={`Saree ${i + 1}`} />
                <div className="saree-overlay">
                  <span>{['Silk Saree', 'Kadi Fabric', 'Dress Material', 'Dupatta', 'Party Wear'][i]}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Quality badge */}
          <motion.div
            className="quality-badge"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <span className="quality-badge-inner">
              ★ 100%<br />Authentic
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom marquee strip */}
      <div className="banner-marquee-strip">
        <div className="marquee-content">
          {Array.from({ length: 4 }).map((_, idx) => (
            <span key={idx}>
              🥻 Silk Sarees &nbsp;·&nbsp; 🧵 Kadi Fabrics &nbsp;·&nbsp; 👗 Dress Materials &nbsp;·&nbsp;
              🧣 Dupattas &nbsp;·&nbsp; ✨ New Arrivals &nbsp;·&nbsp; 🏷️ Flash Deals &nbsp;·&nbsp;
              📍 Arundelpet, Guntur &nbsp;·&nbsp; 📞 9493447776 &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
