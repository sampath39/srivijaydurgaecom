import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Boxes, Search, AlertTriangle, CheckCircle, RefreshCcw, Edit2, Save, X } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editVal,   setEditVal]   = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/inventory')
      setProducts(data.data || [])
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditVal(String(product.stock_count))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditVal('')
  }

  const saveStock = async (id) => {
    const val = parseInt(editVal)
    if (isNaN(val) || val < 0) { toast.error('Enter a valid stock number'); return }
    setSaving(true)
    try {
      await api.put(`/admin/inventory/${id}`, { stock_count: val })
      setProducts(ps => ps.map(p => p.id === id ? { ...p, stock_count: val } : p))
      toast.success('Stock updated!')
      cancelEdit()
    } catch {
      toast.error('Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  const stockStatus = (count) => {
    if (count === 0)  return { label: 'Out of Stock',  color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     icon: '🔴' }
    if (count <= 5)   return { label: 'Critical',       color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: '🟠' }
    if (count <= 20)  return { label: 'Low Stock',      color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: '🟡' }
    return              { label: 'In Stock',          color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: '🟢' }
  }

  const outOfStock  = products.filter(p => p.stock_count === 0).length
  const lowStock    = products.filter(p => p.stock_count > 0 && p.stock_count <= 20).length
  const healthy     = products.filter(p => p.stock_count > 20).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage product stock levels</p>
        </div>
        <button onClick={load} className="btn-outline gap-2 py-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Out of Stock', value: outOfStock, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
          { label: 'Low Stock (≤20)', value: lowStock,    icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Healthy Stock', value: healthy,    icon: <CheckCircle className="w-5 h-5" />,   color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(c => (
          <div key={c.label} className={`card p-4 flex items-center gap-3 ${c.color}`}>
            {c.icon}
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs opacity-80">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No products found
                  </td>
                </tr>
              ) : filtered.map((product, idx) => {
                const status  = stockStatus(product.stock_count)
                const isEditing = editingId === product.id
                return (
                  <motion.tr key={product.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-dark-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center shrink-0">
                            <Boxes className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.categories?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number" min={0} value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveStock(product.id); if (e.key === 'Escape') cancelEdit() }}
                          className="input w-20 py-1.5 text-center"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-bold text-base ${status.color}`}>{product.stock_count}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveStock(product.id)} disabled={saving}
                            className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 transition-colors">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-500 hover:bg-gray-200 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(product)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
