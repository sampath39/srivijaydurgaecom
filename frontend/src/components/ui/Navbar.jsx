import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Heart, Search, Sun, Moon, User, Menu, X,
  Bell, LogOut, Settings, Package, Gift, ChevronDown, Home,
  Phone, MapPin
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { clearAuth } from '../../store/slices/authSlice'
import { toggleDarkMode } from '../../store/slices/uiSlice'
import { toggleCart } from '../../store/slices/cartSlice'
import { selectCartCount } from '../../store/slices/cartSlice'
import { selectWishlistItems } from '../../store/slices/wishlistSlice'
import toast from 'react-hot-toast'

import { TAXONOMY } from '../../lib/taxonomy'

const CATEGORIES = [
  { name: 'Sarees', slug: 'sarees', icon: '🥻' },
  { name: 'Kadi Fabrics', slug: 'kadi-fabrics', icon: '🧵' },
  { name: 'Dress Materials', slug: 'dress-materials', icon: '👗' },
  { name: 'Dupattas', slug: 'dupattas', icon: '🧣' },
  { name: 'Kurtas & Sets', slug: 'kurtas-sets', icon: '👔' },
  { name: 'Bedsheets', slug: 'bedsheets', icon: '🛏️' },
]

export default function Navbar() {
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const location    = useLocation()
  const { user, profile, isAdmin } = useSelector(s => s.auth)
  const darkMode    = useSelector(s => s.ui.darkMode)
  const cartCount   = useSelector(selectCartCount)
  const wishlistItems = useSelector(selectWishlistItems)

  const [scrolled, setScrolled]         = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [catMenuOpen, setCatMenuOpen]   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen]       = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (user) {
      supabase.from('notifications').select('*').eq('user_id', user.id)
        .eq('is_read', false).order('created_at', { ascending: false }).limit(10)
        .then(({ data }) => setNotifications(data || []))
    }
  }, [user])

  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])

  const handleLogout = () => {
    supabase.auth.signOut().catch(err => {
      console.error('Supabase signOut error in Navbar:', err)
    })
    dispatch(clearAuth())
    setUserMenuOpen(false)
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const unreadCount = notifications.length

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-gradient-gold text-white text-center text-xs py-1.5 px-4 font-medium">
        🎉 Free shipping on orders above ₹999 | Owner: Eswar Rao | Call us: 9493447776 | Arundelpet, Guntur
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-dark-900/95 backdrop-blur-md shadow-lg'
          : 'bg-white dark:bg-dark-900'
      } border-b border-gray-100 dark:border-dark-700`}>
        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/durga-logo.png" alt="Sri Vijaya Durga Kadi Emporium Logo" className="w-12 h-12 rounded-xl object-contain drop-shadow-md bg-gradient-to-br from-amber-50 to-white dark:from-dark-800 dark:to-dark-900 border border-amber-200 dark:border-dark-700" />
              <div className="hidden sm:block">
                <p className="font-display font-bold text-gray-900 dark:text-white leading-tight text-sm tracking-wide">
                  Sri Vijaya Durga Kadi Emporium
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 font-medium text-sm transition-colors">
                Home
              </Link>
              
              {location.pathname.startsWith('/products') ? (
                /* Mega Menu - Only on Products Page */
                <>
                  {Object.keys(TAXONOMY).map(dept => (
                    <div key={dept} className="relative py-4 group">
                      <Link to={`/products?department=${dept}`} className="flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-primary-600 font-medium text-sm transition-colors">
                        {dept} <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                      </Link>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[600px] bg-white dark:bg-dark-800 rounded-b-2xl shadow-premium border border-gray-100 dark:border-dark-700 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="flex gap-8">
                          {Object.entries(TAXONOMY[dept]).map(([groupName, items]) => (
                            <div key={groupName} className="flex-1">
                              {groupName !== 'All' && <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">{groupName}</h3>}
                              <ul className="space-y-2">
                                {items.map(item => (
                                  <li key={item}>
                                    <Link to={`/products?category=${item}`} className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-sm transition-colors capitalize block py-1">
                                      {item.replace(/-/g, ' ')}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                /* Simple Dropdown - On Homepage */
                <div className="relative py-2" onMouseEnter={() => setCatMenuOpen(true)} onMouseLeave={() => setCatMenuOpen(false)}>
                  <button className="flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-primary-600 font-medium text-sm transition-colors">
                    Categories <ChevronDown className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {catMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full left-0 mt-0.5 w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-dark-700 p-3 grid grid-cols-2 gap-1 z-50"
                      >
                        {CATEGORIES.map(cat => (
                          <Link key={cat.slug} to={`/products?category=${cat.slug}`}
                            onClick={() => setCatMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-200 hover:text-primary-600 transition-colors text-sm"
                          >
                            <span>{cat.icon}</span>{cat.name}
                          </Link>
                        ))}
                        <Link to="/products" onClick={() => setCatMenuOpen(false)}
                          className="col-span-2 text-center py-2 text-primary-600 font-medium text-sm hover:underline"
                        >
                          View All Products →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search sarees, kadi, fabrics..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-xl bg-gray-50 dark:bg-dark-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search — mobile */}
              <button onClick={() => setSearchOpen(true)} className="md:hidden btn-ghost p-2">
                <Search className="w-5 h-5" />
              </button>

              {/* Dark mode */}
              <button onClick={() => dispatch(toggleDarkMode())} className="btn-ghost p-2 flex">
                {darkMode ? <Sun className="w-5 h-5 text-primary-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="btn-ghost p-2 relative hidden sm:flex">
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)} className="btn-ghost p-2 relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-dark-700 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                          <button className="text-primary-600 text-xs hover:underline">Mark all read</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-center py-6 text-gray-400 text-sm">No new notifications</p>
                          ) : notifications.map(n => (
                            <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Cart */}
              <button onClick={() => dispatch(toggleCart())} className="btn-ghost p-2 relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 btn-ghost py-1.5 pl-1.5 pr-3">
                    <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[80px] truncate">
                      {profile?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-dark-700 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{profile?.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          {profile?.reward_points > 0 && (
                            <p className="text-xs text-primary-600 mt-1 font-medium">🏆 {profile.reward_points} pts</p>
                          )}
                        </div>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 font-medium">
                            <Settings className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                        {[
                          { to: '/profile', icon: User, label: 'My Profile' },
                          { to: '/orders', icon: Package, label: 'My Orders' },
                          { to: '/wishlist', icon: Heart, label: 'Wishlist' },
                          { to: '/rewards', icon: Gift, label: 'Rewards & Points' },
                          { to: '/referral', icon: Gift, label: 'Referral' },
                        ].map(item => (
                          <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700">
                            <item.icon className="w-4 h-4" /> {item.label}
                          </Link>
                        ))}
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 border-t border-gray-100 dark:border-dark-700">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost py-2 px-3 text-sm hidden sm:flex">Login</Link>
                  <Link to="/signup" className="btn-primary py-2 px-4 text-sm">Sign Up</Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden btn-ghost p-2">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900"
            >
              <div className="page-container py-4 space-y-1">
                <form onSubmit={handleSearch} className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..." className="input pl-10 text-sm" />
                </form>
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
                >
                  <span>🏠</span>Home
                </Link>
                <button onClick={() => dispatch(toggleDarkMode())}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 text-sm font-medium text-left border-none bg-transparent cursor-pointer"
                >
                  <span>{darkMode ? '☀️' : '🌙'}</span> {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
                {location.pathname.startsWith('/products') ? (
                  Object.keys(TAXONOMY).map(dept => (
                    <div key={dept} className="py-2">
                      <div className="px-4 py-2 font-semibold text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-dark-800 rounded-lg">{dept}</div>
                      <div className="pl-6 pr-4 mt-2 grid grid-cols-2 gap-2">
                        {Object.values(TAXONOMY[dept]).flat().map(item => (
                          <Link key={item} to={`/products?category=${item}`} onClick={() => setMobileOpen(false)}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary-600 text-sm py-1 capitalize"
                          >
                            {item.replace(/-/g, ' ')}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  CATEGORIES.map(cat => (
                    <Link key={cat.slug} to={`/products?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 text-sm"
                    >
                      <span>{cat.icon}</span>{cat.name}
                    </Link>
                  ))
                )}
                {!user && (
                  <div className="flex gap-2 pt-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 py-2 text-sm">Login</Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 py-2 text-sm">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Full-screen search overlay — mobile */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start pt-20 px-4">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-lg mx-auto bg-white dark:bg-dark-800 rounded-2xl shadow-premium p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..." className="input pl-10" />
                </div>
                <button type="submit" className="btn-primary px-4">Search</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
