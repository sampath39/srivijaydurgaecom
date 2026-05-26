import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingCart, Star, Truck, Shield, RefreshCcw, Share2, ChevronLeft, ChevronRight, Zap, Plus, Minus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, openCart } from '../../store/slices/cartSlice'
import { toggleWishlist, selectIsWishlisted } from '../../store/slices/wishlistSlice'
import ProductCard from '../../components/ui/ProductCard'
import SkeletonCard from '../../components/ui/SkeletonCard'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)

  const [product, setProduct]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [imgIdx, setImgIdx]       = useState(0)
  const [quantity, setQty]        = useState(1)
  const [selectedSize, setSize]   = useState(null)
  const [related, setRelated]     = useState([])
  const [reviewText, setReview]   = useState('')
  const [rating, setRating]       = useState(0)
  const [submitting, setSubmit]   = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)

  const isWished = useSelector(selectIsWishlisted(product?.id))

  useEffect(() => {
    setLoading(true)
    supabase.from('products')
      .select('*, categories(name,slug), reviews(*, profiles(full_name,avatar_url))')
      .eq('slug', slug).eq('is_active', true).single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
        if (data?.category_id) {
          supabase.from('products').select('*, categories(name,slug)')
            .eq('category_id', data.category_id).eq('is_active', true)
            .neq('id', data.id).limit(4)
            .then(({ data: rel }) => setRelated(rel || []))
        }
      })
  }, [slug])

  if (loading) return (
    <div className="page-container py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-6 rounded" style={{ width: `${80 - i*10}%` }} />)}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-24">
      <p className="text-2xl text-gray-400">Product not found</p>
      <Link to="/products" className="btn-primary mt-6">Browse Products</Link>
    </div>
  )

  const price    = product.discount_price || product.price
  const discount = product.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0
  const images   = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600']

  const handleAddToCart = () => {
    if (product.size_options?.length && !selectedSize) { toast.error('Please select a size'); return }
    dispatch(addToCart({ product, quantity, size: selectedSize }))
    dispatch(openCart())
    toast.success('Added to cart! 🛒')
  }

  const handleBuyNow = () => {
    if (product.size_options?.length && !selectedSize) { toast.error('Please select a size'); return }
    dispatch(addToCart({ product, quantity, size: selectedSize }))
    navigate('/checkout')
  }

  const handleWishlist = () => {
    dispatch(toggleWishlist(product))
    toast(isWished ? 'Removed from wishlist' : 'Added to wishlist ❤️')
  }

  const submitReview = async () => {
    if (!user) { toast.error('Login to submit a review'); return }
    if (rating === 0) { toast.error('Please select a rating star first'); return }
    setSubmit(true)
    const { error } = await supabase.from('reviews')
      .upsert({ user_id: user.id, product_id: product.id, rating, body: reviewText }, { onConflict: 'product_id,user_id' })
    if (error) toast.error(error.message)
    else {
      toast.success('Review submitted! Thank you 🙏')
      setReview('')
      setRating(0)
      // refresh reviews
      supabase.from('reviews').select('*, profiles(full_name,avatar_url)').eq('product_id', product.id)
        .then(({ data }) => setProduct(p => ({ ...p, reviews: data || [] })))
    }
    setSubmit(false)
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700">
        <div className="page-container py-3 flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          {product.categories && <>
            <span>/</span>
            <Link to={`/products?category=${product.categories.slug}`} className="hover:text-primary-600">{product.categories.name}</Link>
          </>}
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div 
              onClick={() => { setZoomScale(1); setIsLightboxOpen(true) }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-700 group cursor-zoom-in"
              title="Click to Zoom Image"
            >
              <AnimatePresence mode="wait">
                <motion.img key={imgIdx}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  src={images[imgIdx]} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-dark-800/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-dark-800/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {discount > 0 && (
                <div className="absolute top-4 left-4 badge bg-accent-500 text-white text-sm font-bold px-3 py-1.5">
                  -{discount}% OFF
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-primary-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-sm uppercase tracking-widest text-gray-400 font-semibold">{product.brand}</p>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-5 h-5 ${s <= Math.round(product.avg_rating || 0) ? 'text-primary-400 fill-primary-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{(product.avg_rating||0).toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.review_count || 0} reviews)</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">{product.sold_count || 0} sold</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary-600">₹{price.toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <span className="text-xl text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
              )}
              {discount > 0 && (
                <span className="badge bg-green-100 text-green-700 font-bold">{discount}% off</span>
              )}
            </div>

            {/* Points */}
            {product.points_reward > 0 && (
              <div className="inline-flex items-center gap-2 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-4 py-2 rounded-xl text-sm font-medium">
                🏆 Earn {product.points_reward} reward points on purchase
              </div>
            )}

            {/* Stock */}
            {product.stock_count <= 10 && product.stock_count > 0 && (
              <p className="text-orange-600 font-semibold text-sm animate-pulse">
                ⚠️ Only {product.stock_count} items left in stock!
              </p>
            )}

            {/* Size selector */}
            {product.size_options?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Size: {selectedSize && <span className="text-primary-600">{selectedSize}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {product.size_options.map(size => (
                    <button key={size} onClick={() => setSize(size)}
                      className={`px-4 py-2 border-2 rounded-xl text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900 dark:text-white">Quantity:</span>
              <div className="flex items-center gap-2 border-2 border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                <button onClick={() => setQty(q => Math.min(product.stock_count, q + 1))}
                  className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAddToCart} disabled={product.stock_count === 0}
                className="btn-primary flex-1 justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={product.stock_count === 0}
                className="btn-secondary flex-1 justify-center py-4 text-base disabled:opacity-50">
                Buy Now
              </button>
              <button onClick={handleWishlist}
                className={`p-4 border-2 rounded-xl transition-all ${isWished ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-600' : 'border-gray-200 dark:border-dark-600 text-gray-400 hover:border-accent-300'}`}>
                <Heart className={`w-5 h-5 ${isWished ? 'fill-accent-500' : ''}`} />
              </button>
              <button className="p-4 border-2 border-gray-200 dark:border-dark-600 rounded-xl text-gray-400 hover:border-gray-300 transition-all"
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}>
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
              {[
                { icon: Truck, text: 'Free shipping above ₹999' },
                { icon: Shield, text: '100% authentic product' },
                { icon: RefreshCcw, text: '7-day easy returns' },
              ].map(f => (
                <div key={f.text} className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{f.text}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Product details */}
            {(product.fabric || product.color || product.sku) && (
              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Product Details</h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {product.sku    && <><span className="text-gray-400">SKU:</span><span className="text-gray-700 dark:text-gray-200">{product.sku}</span></>}
                  {product.fabric && <><span className="text-gray-400">Fabric:</span><span className="text-gray-700 dark:text-gray-200">{product.fabric}</span></>}
                  {product.color  && <><span className="text-gray-400">Color:</span><span className="text-gray-700 dark:text-gray-200">{product.color}</span></>}
                  {product.weight_grams && <><span className="text-gray-400">Weight:</span><span className="text-gray-700 dark:text-gray-200">{product.weight_grams}g</span></>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="section-title text-2xl mb-6">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Review form */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Write a Review</h3>
              {!user ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-3">Login to write a review</p>
                  <Link to="/login" className="btn-primary py-2 px-6">Login</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setRating(s)}>
                          <Star className={`w-8 h-8 transition-colors ${s <= rating ? 'text-primary-400 fill-primary-400' : 'text-gray-300 hover:text-primary-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={reviewText} onChange={e => setReview(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="input resize-none h-28 text-sm" />
                  <button onClick={submitReview} disabled={!reviewText.trim() || submitting}
                    className="btn-primary py-2.5 px-6 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>

            {/* Review list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(product.reviews || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                  <p>No reviews yet. Be the first!</p>
                </div>
              ) : (product.reviews || []).map(review => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {review.profiles?.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{review.profiles?.full_name || 'Customer'}</p>
                        <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-primary-400 fill-primary-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title text-2xl mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Image Zoom Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            {/* Close button */}
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all cursor-pointer z-50 border-none"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-lg z-50">
              <button 
                onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl flex items-center justify-center font-bold text-lg transition-all cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-white font-mono font-bold text-sm min-w-[60px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button 
                onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl flex items-center justify-center font-bold text-lg transition-all cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setZoomScale(1)}
                className="text-xs text-primary-400 hover:text-primary-300 font-bold ml-2 transition-all cursor-pointer border-none bg-transparent"
              >
                Reset
              </button>
            </div>

            {/* Image Container with Zoom support */}
            <div className="w-full h-full max-w-4xl max-h-[85vh] flex items-center justify-center overflow-auto no-scrollbar">
              <motion.img 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                src={images[imgIdx]} 
                alt={product.name} 
                style={{ 
                  transform: `scale(${zoomScale})`, 
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }} 
                className="rounded-lg shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
