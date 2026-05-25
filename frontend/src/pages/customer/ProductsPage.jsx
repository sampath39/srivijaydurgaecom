import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ProductCard from '../../components/ui/ProductCard'
import SkeletonCard from '../../components/ui/SkeletonCard'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
]

const CATEGORIES = [
  { slug: 'sarees', name: 'Sarees' },
  { slug: 'kadi-fabrics', name: 'Kadi Fabrics' },
  { slug: 'dress-materials', name: 'Dress Materials' },
  { slug: 'dupattas', name: 'Dupattas' },
  { slug: 'kurtas-sets', name: 'Kurtas & Sets' },
  { slug: 'bedsheets', name: 'Bedsheets' },
  { slug: 'towels', name: 'Towels' },
  { slug: 'accessories', name: 'Accessories' },
]

export default function ProductsPage() {
  const [params, setParams]   = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  const category  = params.get('category') || ''
  const sort      = params.get('sort')     || 'newest'
  const featured  = params.get('featured') || ''
  const flashSale = params.get('flash_sale') || ''
  const minPrice  = params.get('min_price') || ''
  const maxPrice  = params.get('max_price') || ''
  const page      = parseInt(params.get('page') || '1', 10)
  const LIMIT = 20

  useEffect(() => {
    setLoading(true)
    try {
      const safePage = page > 0 ? page : 1
      const from = (safePage - 1) * LIMIT
      const to = from + LIMIT - 1

      let query = supabase.from('products')
        .select('*, categories!inner(name,slug)', { count: 'exact' })
        .eq('is_active', true)

      if (category)  query = query.eq('categories.slug', category)
      if (featured)  query = query.eq('is_featured', true)
      if (flashSale) query = query.eq('is_flash_sale', true)
      if (minPrice)  query = query.gte('price', minPrice)
      if (maxPrice)  query = query.lte('price', maxPrice)

      const sortMap = {
        newest:     ['created_at', false],
        popular:    ['sold_count', false],
        price_asc:  ['price', true],
        price_desc: ['price', false],
        rating:     ['avg_rating', false],
      }
      const [col, asc] = sortMap[sort] || ['created_at', false]
      query = query.order(col, { ascending: asc }).range(from, to)

      query.then(({ data, error, count }) => {
        if (error) {
          console.error("Supabase query error in ProductsPage:", error)
          setProducts([])
          setTotal(0)
        } else {
          setProducts(data || [])
          setTotal(count || 0)
        }
        setLoading(false)
      }).catch(err => {
        console.error("Supabase query promise rejected in ProductsPage:", err)
        setProducts([])
        setTotal(0)
        setLoading(false)
      })
    } catch (err) {
      console.error("Failed to execute products query in ProductsPage:", err)
      setProducts([])
      setTotal(0)
      setLoading(false)
    }
  }, [params])

  const updateParam = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const clearAll = () => setParams({})

  const activeFilters = [
    category  && { key: 'category',   label: category },
    featured  && { key: 'featured',   label: 'Featured' },
    flashSale && { key: 'flash_sale', label: 'Flash Sale' },
    minPrice  && { key: 'min_price',  label: `Min ₹${minPrice}` },
    maxPrice  && { key: 'max_price',  label: `Max ₹${maxPrice}` },
  ].filter(Boolean)

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title text-2xl md:text-3xl">
            {flashSale ? '⚡ Flash Sale' : featured ? '⭐ Featured' : category ? CATEGORIES.find(c=>c.slug===category)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select value={sort} onChange={e => updateParam('sort', e.target.value)}
              className="input py-2 pr-8 text-sm appearance-none cursor-pointer min-w-[160px]">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {/* Filter toggle */}
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="btn-outline py-2 px-4 text-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters.length > 0 && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <button key={f.key} onClick={() => updateParam(f.key, '')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm hover:bg-primary-200 transition-colors">
              {f.label} <X className="w-3 h-3" />
            </button>
          ))}
          <button onClick={clearAll}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm underline">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
              <div className="w-60 space-y-6">
                {/* Category filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Category</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat.slug} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="category" value={cat.slug}
                          checked={category === cat.slug}
                          onChange={() => updateParam('category', category === cat.slug ? '' : cat.slug)}
                          className="accent-primary-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Price Range</h4>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={minPrice}
                      onChange={e => updateParam('min_price', e.target.value)}
                      className="input py-2 text-sm" />
                    <input type="number" placeholder="Max" value={maxPrice}
                      onChange={e => updateParam('max_price', e.target.value)}
                      className="input py-2 text-sm" />
                  </div>
                </div>

                {/* Type filters */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Type</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Featured', key: 'featured', val: 'true' },
                      { label: 'Flash Sale', key: 'flash_sale', val: 'true' },
                    ].map(f => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={params.get(f.key) === f.val}
                          onChange={e => updateParam(f.key, e.target.checked ? f.val : '')}
                          className="accent-primary-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
              <button onClick={clearAll} className="btn-primary mt-6">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button disabled={page === 1} onClick={() => updateParam('page', page - 1)}
                    className="btn-outline py-2 px-4 text-sm disabled:opacity-40">← Prev</button>
                  <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total/LIMIT)}</span>
                  <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => updateParam('page', page + 1)}
                    className="btn-outline py-2 px-4 text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
