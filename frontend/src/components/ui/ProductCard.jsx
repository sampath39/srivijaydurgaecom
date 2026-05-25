import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react'
import { addToCart, openCart } from '../../store/slices/cartSlice'
import { toggleWishlist, selectIsWishlisted } from '../../store/slices/wishlistSlice'
import toast from 'react-hot-toast'

export default function ProductCard({ product, index = 0 }) {
  const dispatch   = useDispatch()
  const isWished   = useSelector(selectIsWishlisted(product.id))
  const [adding, setAdding] = useState(false)

  const price    = product.discount_price || product.price
  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0

  const handleAddToCart = async (e) => {
    e.preventDefault()
    setAdding(true)
    dispatch(addToCart({ product, quantity: 1 }))
    dispatch(openCart())
    toast.success(`${product.name.substring(0, 20)}... added to cart!`, {
      icon: '🛒',
    })
    setTimeout(() => setAdding(false), 1000)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    dispatch(toggleWishlist(product))
    toast(isWished ? 'Removed from wishlist' : 'Added to wishlist ❤️', {
      icon: isWished ? '💔' : '❤️',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="product-card group relative"
    >
      <Link to={`/products/${product.slug}`}>
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-dark-700">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="badge bg-accent-500 text-white font-bold text-xs">-{discount}%</span>
            )}
            {product.is_flash_sale && (
              <span className="badge bg-primary-500 text-white font-bold text-xs flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Flash
              </span>
            )}
            {product.stock_count <= 5 && product.stock_count > 0 && (
              <span className="badge bg-orange-500 text-white text-xs">Only {product.stock_count} left!</span>
            )}
            {product.stock_count === 0 && (
              <span className="badge bg-gray-500 text-white text-xs">Out of Stock</span>
            )}
          </div>

          {/* Wishlist button */}
          <motion.button
            onClick={handleWishlist}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-dark-800 rounded-full shadow-md flex items-center justify-center transition-all duration-200"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? 'text-accent-500 fill-accent-500' : 'text-gray-400 group-hover:text-accent-400'}`} />
          </motion.button>

          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end">
            <motion.button
              onClick={handleAddToCart}
              disabled={product.stock_count === 0 || adding}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 transform translate-y-full group-hover:translate-y-0
                ${product.stock_count === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : adding
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
            >
              {adding ? (
                <><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span> Added!</>
              ) : product.stock_count === 0 ? (
                'Out of Stock'
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{product.brand}</p>
          )}
          <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mt-0.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.avg_rating) ? 'text-primary-400 fill-primary-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-xs text-gray-500">({product.review_count || 0})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-primary-600 text-base">₹{price.toLocaleString('en-IN')}</span>
            {product.discount_price && (
              <span className="text-gray-400 line-through text-sm">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>

          {product.points_reward > 0 && (
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
              🏆 Earn {product.points_reward} pts
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
