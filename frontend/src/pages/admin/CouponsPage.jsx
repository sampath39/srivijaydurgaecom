import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Trash2, Search, RefreshCcw, X, CheckCircle, XCircle, Percent, IndianRupee } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', min_order_value: '0',
  max_discount: '', usage_limit: '100', expires_at: '', is_active: true,
}

export default function CouponsPage() {
  const [coupons,    setCoupons]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/coupons/admin/all')
      setCoupons(data.data || [])
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return }
    if (!form.value)       { toast.error('Discount value is required'); return }
    setSaving(true)
    try {
      const payload = {
        code:            form.code.toUpperCase().trim(),
        type:            form.type,
        value:           parseFloat(form.value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_discount:    form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit:     parseInt(form.usage_limit) || 100,
        expires_at:      form.expires_at || null,
        is_active:       form.is_active,
      }
      await api.post('/coupons', payload)
      toast.success('Coupon created!')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { is_active: !coupon.is_active })
      setCoupons(cs => cs.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      toast.success(coupon.is_active ? 'Coupon disabled' : 'Coupon enabled')
    } catch {
      toast.error('Failed to update coupon')
    }
  }

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return
    setDeletingId(id)
    try {
      await api.delete(`/coupons/${id}`)
      setCoupons(cs => cs.filter(c => c.id !== id))
      toast.success('Coupon deleted')
    } catch {
      toast.error('Failed to delete coupon')
    } finally {
      setDeletingId(null)
    }
  }

  const isExpired = (coupon) => coupon.expires_at && new Date(coupon.expires_at) < new Date()

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage discount codes for customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-outline gap-2 py-2">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search coupons…" className="input pl-9" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Min Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Usage</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Expires</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No coupons found
                    </td>
                  </tr>
                ) : filtered.map((coupon, idx) => (
                  <motion.tr key={coupon.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                      {coupon.type === 'percentage'
                        ? <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5 text-gray-400" />{coupon.value}%</span>
                        : <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-gray-400" />₹{coupon.value}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ₹{Number(coupon.min_order_value || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {coupon.used_count || 0} / {coupon.usage_limit}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {coupon.expires_at
                        ? <span className={isExpired(coupon) ? 'text-red-500' : ''}>
                            {new Date(coupon.expires_at).toLocaleDateString('en-IN')}
                            {isExpired(coupon) && ' (expired)'}
                          </span>
                        : 'No expiry'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(coupon)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                          coupon.is_active && !isExpired(coupon)
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-500'
                        }`}>
                        {coupon.is_active && !isExpired(coupon)
                          ? <><CheckCircle className="w-3.5 h-3.5" /> Active</>
                          : <><XCircle className="w-3.5 h-3.5" /> Inactive</>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteCoupon(coupon.id)} disabled={deletingId === coupon.id}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Create Coupon</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label">Coupon Code *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE20" className="input font-mono tracking-widest" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Value *</label>
                    <input type="number" min={0} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                      placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'} className="input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Min Order (₹)</label>
                    <input type="number" min={0} value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="label">Max Discount (₹)</label>
                    <input type="number" min={0} value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                      placeholder="Optional" className="input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Usage Limit</label>
                    <input type="number" min={1} value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="label">Expires On</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                      min={new Date().toISOString().slice(0, 10)} className="input" />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-dark-600 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Active (usable by customers)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center py-3">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Coupon'}
                </button>
                <button onClick={() => setShowModal(false)} className="btn-ghost px-6">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
