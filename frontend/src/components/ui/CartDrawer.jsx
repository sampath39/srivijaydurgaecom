import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Tag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { closeCart, removeFromCart, updateQuantity, selectCartItems, selectCartTotal, selectCartIsOpen } from '../../store/slices/cartSlice'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items    = useSelector(selectCartItems)
  const total    = useSelector(selectCartTotal)
  const isOpen   = useSelector(selectCartIsOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overlay" onClick={() => dispatch(closeCart())} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-800 z-50 shadow-premium flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Your Cart</h2>
                {items.length > 0 && (
                  <span className="badge-gold">{items.length} items</span>
                )}
              </div>
              <button onClick={() => dispatch(closeCart())} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
                  <button onClick={() => { dispatch(closeCart()); navigate('/products'); }} className="btn-primary mt-6">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div key={`${item.product.id}-${item.size}`}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 bg-gray-50 dark:bg-dark-700 rounded-xl p-3"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                        <img src={item.product.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                          {item.product.name}
                        </p>
                        {item.size && <p className="text-xs text-gray-500 mt-0.5">Size: {item.size}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white dark:bg-dark-600 rounded-lg border border-gray-200 dark:border-dark-500">
                            <button className="p-1.5 hover:text-primary-600 transition-colors"
                              onClick={() => dispatch(updateQuantity({ productId: item.product.id, size: item.size, quantity: item.quantity - 1 }))}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                            <button className="p-1.5 hover:text-primary-600 transition-colors"
                              onClick={() => dispatch(updateQuantity({ productId: item.product.id, size: item.size, quantity: item.quantity + 1 }))}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-primary-600">
                              ₹{((item.product.discount_price || item.product.price) * item.quantity).toLocaleString('en-IN')}
                            </p>
                            <button onClick={() => dispatch(removeFromCart({ productId: item.product.id, size: item.size }))}
                              className="text-gray-400 hover:text-accent-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 dark:border-dark-700 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-primary-700 dark:text-primary-400">Have a coupon? Apply at checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-gray-400">Shipping & taxes calculated at checkout</p>
                <Link to="/checkout" onClick={() => dispatch(closeCart())}
                  className="btn-primary w-full justify-center text-base py-3.5">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/cart" onClick={() => dispatch(closeCart())}
                  className="btn-ghost w-full justify-center text-sm">
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
