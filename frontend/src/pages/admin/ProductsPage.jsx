import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, AlertTriangle, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const [confirmId, setConfirmId]     = useState(null)   // product id pending delete
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting]       = useState(false)
  const [seeding, setSeeding]         = useState(false)
  const LIMIT = 15

  const load = async (p = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get(`/products/admin/all?search=${q}&page=${p}&limit=${LIMIT}`)
      setProducts(data.data || [])
      setTotal(data.count || 0)
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    const tId = toast.loading('Seeding default products...')
    try {
      await api.post('/products/admin/seed-defaults')
      toast.success('Successfully loaded default products!', { id: tId })
      setPage(1)
      load(1, search)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load default products'
      toast.error(msg, { id: tId })
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => { load(page, search) }, [page])
  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1, search) }

  const askDelete = (id, name) => {
    setConfirmId(id)
    setConfirmName(name)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/products/${confirmId}`)
      setProducts(p => p.filter(x => x.id !== confirmId))
      setTotal(t => t - 1)
      toast.success('Product permanently deleted — customers can no longer see it')
    } catch {
      toast.error('Failed to delete product')
    }
    setDeleting(false)
    setConfirmId(null)
    setConfirmName('')
  }

  return (
    <div className="space-y-6">

      {/* ── Confirm Delete Modal ── */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Permanently Delete Product?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5">
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong>"{confirmName}"</strong> will be <strong>permanently removed</strong> from the database. 
                  Customers will immediately stop seeing this product.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmId(null); setConfirmName('') }}
                  className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-dark-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Yes, Delete Permanently</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-400 text-sm">{total} total products (all statuses)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding || loading}
            className="btn-outline py-2.5 px-4 text-sm flex items-center gap-2"
          >
            {seeding ? (
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4 text-primary-500" />
            )}
            Load Defaults
          </button>
          <Link to="/admin/products/new" className="btn-primary py-2.5 px-5">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
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
                  className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
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
                      {p.is_active ? 'Live' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/products/${p.slug}`} target="_blank"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View Live">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/admin/products/edit/${p.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => askDelete(p.id, p.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Permanently Delete">
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
