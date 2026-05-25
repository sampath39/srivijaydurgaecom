import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { toggleWishlist, selectWishlistItems } from '../../store/slices/wishlistSlice'
import { addToCart, openCart } from '../../store/slices/cartSlice'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const items    = useSelector(selectWishlistItems)

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center page-container">
      <Heart className="w-24 h-24 text-gray-200 dark:text-dark-600 mx-auto mb-5" />
      <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Wishlist is Empty</h2>
      <p className="text-gray-500 mb-6">Save products you love and come back later!</p>
      <Link to="/products" className="btn-primary">Explore Products</Link>
    </div>
  )

  return (
    <div className="page-container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">My Wishlist <span className="text-primary-500">({items.length})</span></h1>
        <button onClick={() => { items.forEach(p => dispatch(toggleWishlist(p))); toast.success('Wishlist cleared') }}
          className="btn-ghost text-sm text-accent-600 hover:text-accent-700">Clear All</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((product, i) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }}
            className="card overflow-hidden group">
            <Link to={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src={product.images?.[0] || ''} alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {product.discount_price && (
                <span className="absolute top-2 left-2 badge bg-accent-500 text-white text-xs">
                  -{Math.round(((product.price-product.discount_price)/product.price)*100)}%
                </span>
              )}
            </Link>
            <div className="p-3">
              <Link to={`/products/${product.slug}`}>
                <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 hover:text-primary-600 transition-colors">{product.name}</p>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-primary-600">₹{(product.discount_price||product.price).toLocaleString('en-IN')}</span>
                {product.discount_price && <span className="text-gray-400 line-through text-xs">₹{product.price.toLocaleString('en-IN')}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { dispatch(addToCart({product,quantity:1})); dispatch(openCart()); toast.success('Added to cart!') }}
                  disabled={product.stock_count===0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </button>
                <button onClick={() => dispatch(toggleWishlist(product))}
                  className="p-2 border border-gray-200 dark:border-dark-600 rounded-lg text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
