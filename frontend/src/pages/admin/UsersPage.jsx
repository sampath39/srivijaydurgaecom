import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, ChevronLeft, ChevronRight, Mail, Phone, CheckCircle, AlertCircle, X, Send, Loader2, Tag } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const LIMIT = 20

  // Selection states
  const [selectedUsers, setSelectedUsers] = useState([])

  // Modal / Compose state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [broadcastResults, setBroadcastResults] = useState(null)
  const [broadcastForm, setBroadcastForm] = useState({
    recipientType: 'all',
    mode: 'custom',
    body: '',
    templateSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
    variables: { '1': '', '2': '' }
  })

  // Coupon modal states
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponUser, setCouponUser] = useState(null)
  const [creatingCoupon, setCreatingCoupon] = useState(false)
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    min_order_value: 0,
    usage_limit: 1,
    expires_at: ''
  })

  const handleOpenCouponModal = (user) => {
    const namePrefix = (user.full_name || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    setCouponUser(user)
    setCouponForm({
      code: `DISC-${namePrefix}-${rand}`,
      type: 'percentage',
      value: 10,
      min_order_value: 0,
      usage_limit: 1,
      expires_at: ''
    })
    setShowCouponModal(true)
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    setCreatingCoupon(true)
    try {
      const payload = {
        code: couponForm.code.toUpperCase(),
        type: couponForm.type,
        value: Number(couponForm.value),
        min_order_value: Number(couponForm.min_order_value),
        usage_limit: Number(couponForm.usage_limit),
        user_id: couponUser.id,
        is_active: true,
        expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null
      }
      await api.post('/coupons', payload)
      toast.success(`Coupon ${payload.code} created for ${couponUser.full_name || couponUser.email}!`)
      setShowCouponModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create coupon')
    } finally {
      setCreatingCoupon(false)
    }
  }

  // Synchronize recipientType with selectedUsers state
  useEffect(() => {
    setBroadcastForm(prev => ({
      ...prev,
      recipientType: selectedUsers.length > 0 ? 'selected' : 'all'
    }))
  }, [selectedUsers])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/users?page=${page}&limit=${LIMIT}&search=${search}`)
      setUsers(data.data || [])
      setTotal(data.count || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    setSelectedUsers([])
    load()
  }, [page])

  const handleSelectUser = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const closeBroadcastModal = () => {
    setShowBroadcastModal(false)
    setBroadcastResults(null)
    setBroadcastForm({
      recipientType: selectedUsers.length > 0 ? 'selected' : 'all',
      mode: 'custom',
      body: '',
      templateSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      variables: { '1': '', '2': '' }
    })
  }

  const handleSendBroadcast = async () => {
    setSending(true)
    try {
      const payload = {
        recipientType: broadcastForm.recipientType,
        userIds: broadcastForm.recipientType === 'selected' ? selectedUsers : [],
        mode: broadcastForm.mode,
      }

      if (broadcastForm.mode === 'template') {
        payload.templateSid = broadcastForm.templateSid
        payload.templateVariables = broadcastForm.variables
      } else {
        payload.body = broadcastForm.body
      }

      const { data } = await api.post('/admin/whatsapp/send', payload)
      if (data.success) {
        setBroadcastResults(data)
        toast.success('Broadcast processing completed!')
      } else {
        toast.error(data.message || 'Failed to send broadcast')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error sending broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-400 text-sm">{total} registered users</p>
        </div>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="btn-primary py-2.5 px-5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Phone className="w-4 h-4" /> Send WhatsApp Message
        </button>
      </div>

      <form onSubmit={e=>{e.preventDefault();setSelectedUsers([]);setPage(1);load()}} className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." className="input pl-10 py-2.5 text-sm" />
        </div>
        <button type="submit" className="btn-outline py-2.5 px-4 text-sm">Search</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                    className="accent-primary-500 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {['Customer','Contact','Joined','Orders','Points','Role','Actions'].map(h=>(
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {loading ? Array(8).fill(0).map((_,i)=>(<tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-10 rounded" /></td></tr>))
              : users.map(u=>(
                <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${selectedUsers.includes(u.id) ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                      className="accent-primary-500 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.full_name?.[0]?.toUpperCase()||'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.full_name||'—'}</p>
                        <p className="text-xs text-gray-400">{u.referral_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 dark:text-gray-300 text-xs flex items-center gap-1"><Mail className="w-3 h-3"/>{u.email}</p>
                    {u.phone&&<p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{u.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.order_count||0}</td>
                  <td className="px-4 py-3"><span className="text-primary-600 font-bold">{u.reward_points||0} pts</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.role==='admin'?'badge-gold':'badge-blue'}`}>{u.role||'customer'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleOpenCouponModal(u)}
                        className="btn-ghost p-1.5 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        title="Give Individual Coupon"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-700">
            <p className="text-xs text-gray-400">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page>=Math.ceil(total/LIMIT)} onClick={()=>setPage(p=>p+1)} className="p-1.5 border border-gray-200 dark:border-dark-600 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Dialog */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeBroadcastModal} />

            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 md:p-8 text-left align-middle shadow-premium border border-gray-100 dark:border-dark-700 transition-all z-10"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-4 mb-6">
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary-500" /> WhatsApp Campaign Manager
                  </h3>
                  <button onClick={closeBroadcastModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!broadcastResults ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recipient Audience</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          broadcastForm.recipientType === 'selected'
                            ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                            : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                        } ${selectedUsers.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <input
                            type="radio"
                            name="recipientType"
                            value="selected"
                            checked={broadcastForm.recipientType === 'selected'}
                            disabled={selectedUsers.length === 0}
                            onChange={(e) => setBroadcastForm(f => ({ ...f, recipientType: e.target.value }))}
                            className="accent-primary-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Selected Customers</p>
                            <p className="text-xs text-gray-400">{selectedUsers.length} users chosen</p>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          broadcastForm.recipientType === 'all'
                            ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                            : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                        }`}>
                          <input
                            type="radio"
                            name="recipientType"
                            value="all"
                            checked={broadcastForm.recipientType === 'all'}
                            onChange={(e) => setBroadcastForm(f => ({ ...f, recipientType: e.target.value }))}
                            className="accent-primary-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">All Customers</p>
                            <p className="text-xs text-gray-400">{total} users total</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message Format</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          broadcastForm.mode === 'custom'
                            ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                            : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                        }`}>
                          <input
                            type="radio"
                            name="mode"
                            value="custom"
                            checked={broadcastForm.mode === 'custom'}
                            onChange={(e) => setBroadcastForm(f => ({ ...f, mode: e.target.value }))}
                            className="accent-primary-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Custom Text</p>
                            <p className="text-xs text-gray-400">Direct message body</p>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          broadcastForm.mode === 'template'
                            ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                            : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                        }`}>
                          <input
                            type="radio"
                            name="mode"
                            value="template"
                            checked={broadcastForm.mode === 'template'}
                            onChange={(e) => setBroadcastForm(f => ({ ...f, mode: e.target.value }))}
                            className="accent-primary-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Appointment Template</p>
                            <p className="text-xs text-gray-400">Pre-approved sandbox layout</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {broadcastForm.mode === 'custom' ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message Body</label>
                        <div className="relative">
                          <textarea
                            value={broadcastForm.body}
                            onChange={(e) => setBroadcastForm(f => ({ ...f, body: e.target.value.slice(0, 1600) }))}
                            placeholder="Type your custom WhatsApp message here..."
                            rows={4}
                            className="input w-full p-3 border rounded-xl dark:bg-dark-700 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                          <div className="text-right text-xs text-gray-400 mt-1">
                            {broadcastForm.body.length}/1600 characters
                          </div>
                        </div>
                        <p className="text-xs text-amber-500 mt-1 flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          Note: Custom text messages can only be received by WhatsApp users with an active 24-hour sandbox session.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Template Fields</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="label text-xs">Date (Variable 1)</label>
                              <input
                                type="text"
                                value={broadcastForm.variables['1']}
                                onChange={(e) => setBroadcastForm(f => ({
                                  ...f,
                                  variables: { ...f.variables, '1': e.target.value }
                                }))}
                                placeholder="e.g. 12/1"
                                className="input py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="label text-xs">Time (Variable 2)</label>
                              <input
                                type="text"
                                value={broadcastForm.variables['2']}
                                onChange={(e) => setBroadcastForm(f => ({
                                  ...f,
                                  variables: { ...f.variables, '2': e.target.value }
                                }))}
                                placeholder="e.g. 3pm"
                                className="input py-2 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Message Preview</label>
                          <div className="bg-gray-100 dark:bg-dark-700 p-4 rounded-xl border border-gray-200 dark:border-dark-600">
                            <p className="text-xs text-gray-400 mb-1 font-mono">Template ID: {broadcastForm.templateSid}</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                              "Your appointment is coming up on <strong className="text-primary-600 dark:text-primary-400 font-semibold">{broadcastForm.variables['1'] || '[Date]'}</strong> at <strong className="text-primary-600 dark:text-primary-400 font-semibold">{broadcastForm.variables['2'] || '[Time]'}</strong>"
                            </p>
                          </div>
                          <p className="text-xs text-emerald-500 mt-1 flex items-start gap-1">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Pre-approved template works automatically even without a prior 24-hour user interaction.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                      <button
                        type="button"
                        onClick={closeBroadcastModal}
                        className="btn-outline py-2.5 px-5 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={sending || (broadcastForm.mode === 'custom' && !broadcastForm.body.trim()) || (broadcastForm.mode === 'template' && (!broadcastForm.variables['1'] || !broadcastForm.variables['2']))}
                        onClick={handleSendBroadcast}
                        className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 justify-center min-w-[120px]"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Send Campaign
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-2xl text-center space-y-3">
                      <h4 className="font-display font-bold text-lg text-gray-900 dark:text-white">Broadcast Results</h4>
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
                        <div className="bg-white dark:bg-dark-700 p-3 rounded-xl shadow-sm">
                          <p className="text-xs text-gray-400">Total Users</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcastResults.summary?.total}</p>
                        </div>
                        <div className="bg-white dark:bg-dark-700 p-3 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                          <p className="text-xs text-emerald-500">Sent</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{broadcastResults.summary?.sent}</p>
                        </div>
                        <div className="bg-white dark:bg-dark-700 p-3 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
                          <p className="text-xs text-red-500">Failed</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{broadcastResults.summary?.failed}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recipient Delivery Status</label>
                      <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-dark-700 rounded-xl divide-y divide-gray-100 dark:divide-dark-700">
                        {broadcastResults.results?.map((res, i) => (
                          <div key={i} className="p-3 flex items-center justify-between gap-4 text-sm hover:bg-gray-50 dark:hover:bg-dark-700/50">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{res.name}</p>
                              <p className="text-xs text-gray-400">{res.phone || 'No phone number'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {res.status === 'sent' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle className="w-3.5 h-3.5" /> Sent
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                                  </span>
                                  <p className="text-[10px] text-red-400 max-w-[150px] truncate" title={res.error}>{res.error}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-dark-700">
                      <button
                        type="button"
                        onClick={closeBroadcastModal}
                        className="btn-primary py-2.5 px-6 text-sm"
                      >
                        Dismiss Results
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && couponUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCouponModal(false)} />
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 text-left align-middle shadow-premium border border-gray-100 dark:border-dark-700 transition-all z-10"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-3 mb-4">
                  <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary-500" /> Create Custom Discount
                  </h3>
                  <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div>
                    <label className="label">Target Customer</label>
                    <input type="text" disabled value={`${couponUser.full_name || 'No Name'} (${couponUser.email})`} className="input opacity-60 bg-gray-50 dark:bg-dark-700" />
                  </div>

                  <div>
                    <label className="label">Coupon Code *</label>
                    <input type="text" required value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input uppercase" placeholder="e.g. DISC-SAMP-1234" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Discount Type</label>
                      <select value={couponForm.type} onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))} className="input py-2">
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Value *</label>
                      <input type="number" required min="1" value={couponForm.value} onChange={e => setCouponForm(f => ({ ...f, value: e.target.value }))} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Min Order Value (₹)</label>
                      <input type="number" min="0" value={couponForm.min_order_value} onChange={e => setCouponForm(f => ({ ...f, min_order_value: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="label">Usage Limit</label>
                      <input type="number" min="1" value={couponForm.usage_limit} onChange={e => setCouponForm(f => ({ ...f, usage_limit: e.target.value }))} className="input" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Expiry Date</label>
                    <input type="date" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} className="input" min={new Date().toISOString().split('T')[0]} />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-dark-700">
                    <button type="button" onClick={() => setShowCouponModal(false)} className="btn-outline py-2 px-4 text-sm">Cancel</button>
                    <button type="submit" disabled={creatingCoupon} className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5 min-w-[120px] justify-center">
                      {creatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Coupon'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
