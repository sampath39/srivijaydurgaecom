import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const LIMIT = 15

  const load = async (p = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get(`/products?search=${q}&page=${p}&limit=${LIMIT}`)
      setProducts(data.data || [])
      setTotal(data.count || 0)
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }

  useEffect(() => { load(page, search) }, [page])
  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1, search) }

  const deleteProduct = async (id) => {
    if (!confirm('Deactivate this product?')) return
    await api.delete(`/products/${id}`)
    setProducts(p => p.filter(x => x.id !== id))
    toast.success('Product deactivated')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-400 text-sm">{total} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary py-2.5 px-5">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." className="input pl-10 py-2.5 text-sm" />
        </div>
        <button type="submit" className="btn-outline py-2.5 px-4 text-sm">Search</button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                {['Product','Category','Price','Stock','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-10 rounded" /></td></tr>
              )) : products.map(p => (
                <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={p.images?.[0]||''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.categories?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">₹{Number(p.discount_price||p.price).toLocaleString('en-IN')}</p>
                    {p.discount_price && <p className="text-xs text-gray-400 line-through">₹{Number(p.price).toLocaleString('en-IN')}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.stock_count <= 5 ? 'text-accent-600' : p.stock_count <= 20 ? 'text-orange-500' : 'text-green-600'}`}>
                      {p.stock_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/products/${p.slug}`} target="_blank"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/admin/products/edit/${p.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteProduct(p.id)}
                        className="p-1.5 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-700">
            <p className="text-xs text-gray-400">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page>=Math.ceil(total/LIMIT)} onClick={() => setPage(p=>p+1)}
                className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
