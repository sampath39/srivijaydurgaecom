import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ProductCard from '../../components/ui/ProductCard'
import SkeletonCard from '../../components/ui/SkeletonCard'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    if (!query) { setResults([]); return }
    setLoading(true)
    
    // Advanced Semantic Full-Text Search via Supabase RPC
    supabase.rpc('search_products', { search_term: query.trim() })
      .then(({ data, error }) => {
        if (error) throw error
        // Fetch categories for the returned products to match the old payload format
        if (data && data.length > 0) {
          const categoryIds = [...new Set(data.map(p => p.category_id).filter(Boolean))]
          if (categoryIds.length > 0) {
            supabase.from('categories').select('id, name, slug').in('id', categoryIds)
              .then(({ data: cats }) => {
                const catMap = {}
                cats?.forEach(c => catMap[c.id] = c)
                const enriched = data.map(p => ({ ...p, categories: catMap[p.category_id] }))
                setResults(enriched)
                setLoading(false)
              })
            return
          }
        }
        setResults(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Search error:', err)
        setResults([])
        setLoading(false)
      })
  }, [query])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) setParams({ q: searchInput.trim() })
  }

  return (
    <div className="page-container py-10">
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search for sarees, kadi fabrics, dress materials..."
            className="input pl-12 pr-12 py-4 text-lg rounded-2xl" />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setParams({}) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {query && (
        <div className="mb-6">
          <p className="text-gray-500">
            {loading ? 'Searching...' : `${results.length} results for `}
            {!loading && <span className="font-semibold text-gray-900 dark:text-white">"{query}"</span>}
          </p>
        </div>
      )}

      {!query ? (
        <div className="text-center py-20">
          <Search className="w-20 h-20 text-gray-200 dark:text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Search for Products</h2>
          <p className="text-gray-400">Try searching for "silk saree", "kadi fabric", "dress material"</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
          <p className="text-gray-400 mb-6">Try different keywords or browse our categories</p>
          <Link to="/products" className="btn-primary">Browse All Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
