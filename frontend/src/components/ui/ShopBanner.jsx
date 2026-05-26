import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star, MapPin, Phone } from 'lucide-react'

const LEFT_SAREES = [
  { src: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', label: 'పట్టు చీర', sub: 'Silk Saree' },
  { src: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', label: 'కాంచీపురం చీర', sub: 'Kanchipuram Saree' },
]

const RIGHT_SAREES = [
  { src: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80', label: 'డ్రెస్ మెటీరియల్', sub: 'Dress Material' },
  { src: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80', label: 'కాది వస్త్రం', sub: 'Kadi Fabric' },
  { src: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&q=80', label: 'దుప్పట్టా', sub: 'Dupatta' },
]

export default function ShopBanner() {
  return (
    <section className="shop-banner-section">

      <div className="shop-banner-inner">

        {/* ── Left: 2 Saree Images ── */}
        <motion.div
          className="shop-banner-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="saree-col">
            {LEFT_SAREES.map((s, i) => (
              <motion.div
                key={i}
                className="saree-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
                whileHover={{ scale: 1.03 }}
              >
                <img src={s.src} alt={s.sub} />
                <div className="saree-panel-label">
                  <span className="saree-telugu">{s.label}</span>
                  <span className="saree-english">{s.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Center: Shop Name ── */}
        <motion.div
          className="shop-banner-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="divine-badge">Est. 1999 · Guntur, Andhra Pradesh</div>

          <div className="shop-name-3d">
            <h1 className="shop-name-line1">Sri Vijaya Durga</h1>
            <h2 className="shop-name-line2">Kadhi Emporium</h2>
            <p className="shop-name-telugu">శ్రీ విజయ దుర్గా ఖాదీ ఎంపోరియం</p>
            <div className="shop-name-underline" />
          </div>

          <p className="shop-tagline">
            Authentic Handloom Sarees · కాది వస్త్రాలు
          </p>

          <div className="shop-rating">
            {[1,2,3,4,5].map(n => <Star key={n} className="star-icon" fill="currentColor" />)}
            <span>4.9 · 10,000+ Customers</span>
          </div>

          <div className="shop-info-pills">
            <a href="tel:9493447776" className="info-pill">
              <Phone className="w-3 h-3" /> 9493447776
            </a>
            <a href="https://maps.google.com/?q=Arundelpet,Guntur" target="_blank" rel="noreferrer" className="info-pill">
              <MapPin className="w-3 h-3" /> Arundelpet, Guntur
            </a>
            <span className="info-pill highlight">25+ Years of Trust</span>
          </div>

          <div className="shop-cta-row">
            <Link to="/products" className="shop-cta-primary">🛍️ Shop Now</Link>
            <Link to="/products?category=sarees" className="shop-cta-secondary">🥻 View Sarees</Link>
          </div>
        </motion.div>

        {/* ── Right: 3 Saree Images ── */}
        <motion.div
          className="shop-banner-right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="saree-col-right">
            {RIGHT_SAREES.map((s, i) => (
              <motion.div
                key={i}
                className="saree-panel-right"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                whileHover={{ scale: 1.03 }}
              >
                <img src={s.src} alt={s.sub} />
                <div className="saree-panel-label">
                  <span className="saree-telugu">{s.label}</span>
                  <span className="saree-english">{s.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Marquee strip */}
      <div className="banner-marquee-strip">
        <div className="marquee-content">
          {[0,1,2,3].map(idx => (
            <span key={idx}>
              🥻 Silk Sarees (పట్టు చీరలు) &nbsp;·&nbsp;
              🧵 Kadi Fabrics (కాది వస్త్రాలు) &nbsp;·&nbsp;
              👗 Dress Materials (డ్రెస్ మెటీరియల్) &nbsp;·&nbsp;
              ✨ New Arrivals (కొత్త రాకలు) &nbsp;·&nbsp;
              📍 Arundelpet, Guntur &nbsp;·&nbsp;
              📞 9493447776 &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
