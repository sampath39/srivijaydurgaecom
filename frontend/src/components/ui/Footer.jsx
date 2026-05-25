import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail } from 'lucide-react'
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-300 mt-16">
      {/* Newsletter */}
      <div className="bg-gradient-gold py-10">
        <div className="page-container text-center">
          <h3 className="font-display text-2xl font-bold text-white mb-2">Get Exclusive Offers</h3>
          <p className="text-white/80 mb-6 text-sm">Subscribe to our newsletter for flash sales, new arrivals & coupon codes</p>
          <form className="flex max-w-md mx-auto gap-2">
            <input placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
            <button type="submit" className="px-6 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-colors">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center text-lg">🥻</div>
            <div>
              <p className="font-display font-bold text-white">Sri Vijaya Durga</p>
              <p className="text-primary-400 text-xs">Kadi Emporium</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Premium handloom textiles & Kadi fabrics. Celebrating Indian craftsmanship since generations.
          </p>
          <div className="flex gap-3">
            {[FaInstagram, FaFacebook, FaTwitter, FaYoutube].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4 text-white" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'All Products' },
              { to: '/products?featured=true', label: 'Featured' },
              { to: '/products?flash_sale=true', label: 'Flash Sales' },
              { to: '/rewards', label: 'Rewards' },
              { to: '/referral', label: 'Refer & Earn' },
            ].map(link => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-semibold text-white mb-4">Categories</h4>
          <ul className="space-y-2.5">
            {[
              { name: 'Sarees', slug: 'sarees' },
              { name: 'Kadi Fabrics', slug: 'kadi-fabrics' },
              { name: 'Dress Materials', slug: 'dress-materials' },
              { name: 'Dupattas', slug: 'dupattas' },
              { name: 'Kurtas & Sets', slug: 'kurtas-sets' },
              { name: 'Bedsheets', slug: 'bedsheets' },
            ].map(c => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`}
                  className="text-sm text-gray-400 hover:text-primary-400 transition-colors">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-white mb-4">Contact Us</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-400">4/1, Arundelpet, Guntur, Andhra Pradesh - 522002</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary-400 shrink-0" />
              <a href="tel:9493447776" className="text-sm text-gray-400 hover:text-primary-400">+91 94934 47776</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary-400 shrink-0" />
              <a href="mailto:info@svdke.com" className="text-sm text-gray-400 hover:text-primary-400">info@svdke.com</a>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400">🕐 Store Hours</p>
            <p className="text-xs text-white mt-1">Mon–Sat: 9AM – 8PM</p>
            <p className="text-xs text-white">Sunday: 10AM – 6PM</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2024 Sri Vijaya Durga Kadi Emporium. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
