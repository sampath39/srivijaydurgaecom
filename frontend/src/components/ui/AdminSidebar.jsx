import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  BarChart2, Boxes, LogOut, Sun, Moon, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { clearAuth } from '../../store/slices/authSlice'
import { toggleDarkMode } from '../../store/slices/uiSlice'
import toast from 'react-hot-toast'

const links = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products',  icon: Package,         label: 'Products' },
  { to: '/admin/orders',    icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/users',     icon: Users,           label: 'Customers' },
  { to: '/admin/coupons',   icon: Tag,             label: 'Coupons' },
  { to: '/admin/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/admin/inventory', icon: Boxes,           label: 'Inventory' },
]

export default function AdminSidebar() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const darkMode  = useSelector(s => s.ui.darkMode)
  const profile   = useSelector(s => s.auth.profile)
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    supabase.auth.signOut().catch(err => {
      console.error('Supabase signOut error in AdminSidebar:', err)
    })
    dispatch(clearAuth())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center text-lg shadow-gold">🥻</div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">SVDKE Admin</p>
            <p className="text-primary-400 text-xs">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Admin info */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
            {profile?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-gray-400 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} text-gray-300 dark:text-gray-300`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <button onClick={() => dispatch(toggleDarkMode())}
          className="sidebar-link w-full text-gray-300">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-accent-400 hover:bg-accent-900/20 transition-all duration-200">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-white/10 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-white shadow-lg">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            className="w-64 bg-dark-900 h-full shadow-premium">
            <SidebarContent />
          </motion.div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
