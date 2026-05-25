import { NavLink, useLocation } from 'react-router-dom'
import { Home, Grid, ShoppingCart, Heart, User } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectCartCount } from '../../store/slices/cartSlice'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/',         icon: Home,         label: 'Home' },
  { to: '/products', icon: Grid,         label: 'Shop' },
  { to: '/cart',     icon: ShoppingCart, label: 'Cart',    badge: true },
  { to: '/wishlist', icon: Heart,        label: 'Wishlist' },
  { to: '/profile',  icon: User,         label: 'Account' },
]

export default function MobileNav() {
  const cartCount = useSelector(selectCartCount)
  const wishCount = useSelector(s => s.wishlist.items.length)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(tab => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 relative ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                  />
                )}
                <div className="relative z-10">
                  <tab.icon className="w-5 h-5" />
                  {tab.to === '/cart' && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                  {tab.to === '/wishlist' && wishCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {wishCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
