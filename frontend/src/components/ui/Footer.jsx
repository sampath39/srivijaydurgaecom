import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail } from 'lucide-react'
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-300 mt-16">
      {/* Main footer */}
      <div className="page-container py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src="/durga-logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-1" />
            <div>
              <p className="font-display font-bold text-white tracking-wide">Sri Vijaya Durga Kadi Emporium</p>
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
              <span className="text-sm text-gray-400">Arundelpet 4/1 opposite Kotak Mahindra Bank, Guntur, Andhra Pradesh, India PIN: 522001</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary-400 shrink-0" />
              <div className="flex flex-col text-sm">
                <a href="tel:9493447776" className="text-gray-400 hover:text-primary-400">+91 9493447776</a>
                <a href="tel:6304258160" className="text-gray-400 hover:text-primary-400">+91 6304258160</a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary-400 shrink-0" />
              <a href="mailto:sampath777yt@gmail.com" className="text-sm text-gray-400 hover:text-primary-400">sampath777yt@gmail.com</a>
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
          <p className="text-xs text-gray-500">© 2026 Surepalli Eswar Rao. All rights reserved.</p>
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
