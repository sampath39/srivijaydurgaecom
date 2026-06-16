import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, X, Home } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ProductCard from '../../components/ui/ProductCard'
import SkeletonCard from '../../components/ui/SkeletonCard'
import { TAXONOMY, PRETTY_NAMES } from '../../lib/taxonomy'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
]

const FILTER_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff', border: true },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#a855f7' }
]

const FILTER_FABRICS = ['Cotton', 'Silk', 'Linen', 'Georgette', 'Chiffon', 'Crepe']


export default function ProductsPage() {
  const [params, setParams]   = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const category    = params.get('category') || ''
  const department  = params.get('department') || ''
  const subcategory = params.get('subcategory') || ''
  const sort        = params.get('sort')     || 'newest'
  const featured    = params.get('featured') || ''
  const flashSale   = params.get('flash_sale') || ''
  const minPrice    = params.get('min_price') || ''
  const maxPrice    = params.get('max_price') || ''
  const colors      = params.get('colors') ? params.get('colors').split(',') : []
  const fabrics     = params.get('fabrics') ? params.get('fabrics').split(',') : []
  const page        = parseInt(params.get('page') || '1', 10)
  const LIMIT = 20

  useEffect(() => {
    setLoading(true)
    async function fetchData() {
      try {
        const safePage = page > 0 ? page : 1
        const from = (safePage - 1) * LIMIT

        // Resolve category slug → category_id
        let categoryId = null
        let categoryIds = []
        if (category) {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single()
          if (catData) categoryId = catData.id
        } else if (department && TAXONOMY[department]) {
          const slugs = Object.values(TAXONOMY[department]).flat()
          const { data: catsData } = await supabase.from('categories').select('id').in('slug', slugs)
          if (catsData) categoryIds = catsData.map(c => c.id)
        }

        let query = supabase.from('products')
          .select('*, categories(name,slug)', { count: 'exact' })
          .eq('is_active', true)

        if (categoryId) {
          query = query.eq('category_id', categoryId)
        } else if (categoryIds.length > 0) {
          query = query.in('category_id', categoryIds)
        }
        if (subcategory) query = query.eq('subcategory', subcategory)
        if (featured)   query = query.eq('is_featured', true)
        if (flashSale)  query = query.eq('is_flash_sale', true)
        if (minPrice)   query = query.gte('price', minPrice)
        if (maxPrice)   query = query.lte('price', maxPrice)
        if (colors.length > 0) query = query.in('color', colors)
        if (fabrics.length > 0) query = query.in('fabric', fabrics)

        const sortMap = {
          newest:     ['created_at', false],
          popular:    ['sold_count', false],
          price_asc:  ['price', true],
          price_desc: ['price', false],
          rating:     ['avg_rating', false],
        }
        const [col, asc] = sortMap[sort] || ['created_at', false]
        const { data, error, count } = await query
          .order(col, { ascending: asc })
          .range(from, from + LIMIT - 1)

        if (error) throw error
        setProducts(data || [])
        setTotal(count || 0)
      } catch (err) {
        console.error('ProductsPage query error:', err)
        setProducts([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params])

  const updateParams = (updates) => {
    const next = new URLSearchParams(params)
    for (const [key, val] of Object.entries(updates)) {
      if (val !== null && val !== undefined && val !== '') {
        next.set(key, val)
      } else {
        next.delete(key)
      }
      if (key !== 'page') next.delete('page')
    }
    setParams(next)
  }

  const updateArrayParam = (paramName, value) => {
    const current = params.get(paramName) ? params.get(paramName).split(',') : []
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    updateParams({ [paramName]: updated.length > 0 ? updated.join(',') : '' })
  }

  const clearAll = () => setParams({})

  const activeFilters = [
    featured  && { key: 'featured',   label: 'Featured' },
    flashSale && { key: 'flash_sale', label: 'Flash Sale' },
    minPrice  && { key: 'min_price',  label: `Min ₹${minPrice}` },
    maxPrice  && { key: 'max_price',  label: `Max ₹${maxPrice}` },
    ...colors.map(c => ({ key: `color_${c}`, label: c, onRemove: () => updateArrayParam('colors', c) })),
    ...fabrics.map(f => ({ key: `fabric_${f}`, label: f, onRemove: () => updateArrayParam('fabrics', f) })),
  ].filter(Boolean)

  // Find which department the current category belongs to
  let currentDept = department || 'Fashion'; 
  if (category) {
    for (const [dept, groups] of Object.entries(TAXONOMY)) {
      for (const items of Object.values(groups)) {
        if (items.includes(category)) {
          currentDept = dept;
          break;
        }
      }
    }
  }

  return (
    <div className="page-container py-6">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600"><Home className="w-4 h-4" /></Link>
        <span>/</span>
        {category ? (
          <Link to={`/products?department=${currentDept}`} className="font-medium text-gray-900 dark:text-gray-200 hover:text-primary-600 transition-colors">{currentDept}</Link>
        ) : (
          <span className="font-medium text-gray-900 dark:text-gray-200">{currentDept}</span>
        )}
        {category && (
          <>
            <span>/</span>
            <span className="font-medium text-primary-600">{PRETTY_NAMES[category] || category}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* ── Left Sidebar (Categories & Filters) ── */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 pr-4 border-r border-gray-100 dark:border-dark-700 min-h-[calc(100vh-8rem)]">
            
            {/* Dynamic Category Navigation System */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{currentDept}</h3>
            
            <div className="space-y-6 mb-8">
              {Object.entries(TAXONOMY[currentDept] || {}).map(([groupName, items]) => (
                <div key={groupName}>
                  {groupName !== 'All' && <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs mb-3 tracking-wider">{groupName}</h4>}
                  <ul className="space-y-1">
                    {items.map(item => {
                      const isActive = category === item;
                      return (
                        <li key={item}>
                          <Link 
                            to={`/products?category=${item}`} 
                            className={`block py-2 px-3 rounded-xl border text-sm transition-all ${
                              isActive 
                                ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-sm' 
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-primary-200 hover:text-primary-600'
                            }`}
                          >
                            {PRETTY_NAMES[item] || item}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <hr className="border-gray-100 dark:border-dark-700 my-6" />

            {/* Price Filter */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Price Range</h4>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={e => updateParams({ min_price: e.target.value })}
                  className="input py-2 text-sm bg-gray-50" />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={e => updateParams({ max_price: e.target.value })}
                  className="input py-2 text-sm bg-gray-50" />
              </div>
            </div>

            <hr className="border-gray-100 dark:border-dark-700 my-6" />

            {/* Colors Filter */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {FILTER_COLORS.map(c => {
                  const isActive = colors.includes(c.name);
                  return (
                    <button key={c.name} onClick={() => updateArrayParam('colors', c.name)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${isActive ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-900' : 'hover:scale-110'} ${c.border ? 'border border-gray-300' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-2 h-2 rounded-full ${c.name === 'White' || c.name === 'Yellow' ? 'bg-black' : 'bg-white'}`} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="border-gray-100 dark:border-dark-700 my-6" />

            {/* Fabric Filter */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Fabric</h4>
              <div className="space-y-2">
                {FILTER_FABRICS.map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={fabrics.includes(f)}
                      onChange={() => updateArrayParam('fabrics', f)}
                      className="accent-primary-500 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100 dark:border-dark-700 my-6" />

            {/* Type Filters */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Type</h4>
              <div className="space-y-2">
                {[
                  { label: 'Featured', key: 'featured', val: 'true' },
                  { label: 'Flash Sale', key: 'flash_sale', val: 'true' },
                ].map(f => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={params.get(f.key) === f.val}
                      onChange={e => updateParams({ [f.key]: e.target.checked ? f.val : '' })}
                      className="accent-primary-500 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
          </div>
        </aside>

        {/* ── Main Product Grid ── */}
        <div className="flex-1 min-w-0">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {category ? PRETTY_NAMES[category] : currentDept}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{total} products found</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select value={sort} onChange={e => updateParams({ sort: e.target.value })}
                  className="input py-2 pl-4 pr-10 text-sm appearance-none cursor-pointer bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 shadow-sm rounded-xl">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button onClick={() => setFilterDrawerOpen(true)}
                className="md:hidden btn-outline py-2 px-4 text-sm flex items-center gap-2 bg-white dark:bg-dark-800">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map(f => (
                <button key={f.key} onClick={() => updateParams({ [f.key]: '' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 transition-colors font-medium">
                  {f.label} <X className="w-3 h-3" />
                </button>
              ))}
              <button onClick={clearAll} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
               {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 dark:bg-dark-800/50 rounded-3xl border border-gray-100 dark:border-dark-700">
              <div className="text-5xl mb-4 opacity-50">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or category selection.</p>
              <button onClick={clearAll} className="btn-primary mt-6 px-8 py-2.5">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
              
              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-dark-700">
                  <button disabled={page === 1} onClick={() => updateParams({ page: page - 1 })}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-700 font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                    Previous
                  </button>
                  <span className="text-gray-500 text-sm font-medium">
                    Page <span className="text-gray-900 dark:text-white">{page}</span> of {Math.ceil(total/LIMIT)}
                  </span>
                  <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => updateParams({ page: page + 1 })}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-700 font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
