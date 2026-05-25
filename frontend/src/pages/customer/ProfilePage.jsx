import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Camera, MapPin, Plus, Trash2, Edit, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import api from '../../lib/axios'
import { setProfile } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user, profile } = useSelector(s => s.auth)
  const [tab, setTab]       = useState('profile')
  const [form, setForm]     = useState({ full_name: profile?.full_name||'', phone: profile?.phone||'' })
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [addrForm, setAddrForm]   = useState(null)

  useEffect(() => {
    api.get('/addresses').then(({ data }) => setAddresses(data.data || []))
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const { data } = await api.put('/auth/profile', form)
    dispatch(setProfile(data.data))
    toast.success('Profile updated!')
    setSaving(false)
  }

  const deleteAddress = async (id) => {
    await api.delete(`/addresses/${id}`)
    setAddresses(a => a.filter(x => x.id !== id))
    toast.success('Address removed')
  }

  const saveAddr = async () => {
    if (!addrForm.full_name || !addrForm.phone || !addrForm.address_line1 || !addrForm.city || !addrForm.state || !addrForm.pincode) {
      toast.error('Fill all required fields'); return
    }
    const { data } = await api.post('/addresses', addrForm)
    setAddresses(a => [...a, data.data])
    setAddrForm(null)
    toast.success('Address saved!')
  }

  const BLANK_ADDR = { full_name:'', phone:'', address_line1:'', address_line2:'', city:'', state:'', pincode:'', country:'India', is_default:false }

  return (
    <div className="page-container py-10">
      <h1 className="section-title mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card p-6 text-center mb-4">
            <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-gold">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{profile?.full_name || 'Customer'}</p>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            {profile?.reward_points > 0 && (
              <div className="mt-2 badge-gold mx-auto inline-block">🏆 {profile.reward_points} pts</div>
            )}
          </div>
          <nav className="card overflow-hidden">
            {[
              { key:'profile', icon:User,   label:'Profile Info' },
              { key:'address', icon:MapPin,  label:'Addresses' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-gray-50 dark:border-dark-700 last:border-0 ${tab===t.key ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-6">Profile Information</h2>
              <div className="space-y-4 max-w-lg">
                <div><label className="label">Full Name</label>
                  <input value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} className="input" />
                </div>
                <div><label className="label">Email</label>
                  <input value={user?.email} disabled className="input opacity-60" />
                </div>
                <div><label className="label">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} className="input" />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary py-3 px-8">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Saved Addresses</h2>
                <button onClick={() => setAddrForm(BLANK_ADDR)} className="btn-primary py-2 px-4 text-sm">
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>
              {addrForm && (
                <div className="card p-5 border-2 border-primary-400">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[{k:'full_name',l:'Full Name *',c:1},{k:'phone',l:'Phone *',c:1},{k:'address_line1',l:'Address Line 1 *',c:2},{k:'address_line2',l:'Address Line 2',c:2},{k:'city',l:'City *',c:1},{k:'state',l:'State *',c:1},{k:'pincode',l:'Pincode *',c:1}].map(f=>(
                      <div key={f.k} className={f.c===2?'col-span-2':''}>
                        <label className="label">{f.l}</label>
                        <input value={addrForm[f.k]||''} onChange={e=>setAddrForm(a=>({...a,[f.k]:e.target.value}))} className="input text-sm" />
                      </div>
                    ))}
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="is_default" checked={addrForm.is_default} onChange={e=>setAddrForm(a=>({...a,is_default:e.target.checked}))} className="accent-primary-500" />
                      <label htmlFor="is_default" className="text-sm text-gray-600 dark:text-gray-300">Set as default address</label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveAddr} className="btn-primary py-2.5 px-6">Save</button>
                    <button onClick={() => setAddrForm(null)} className="btn-ghost py-2.5 px-4">Cancel</button>
                  </div>
                </div>
              )}
              {addresses.map(addr => (
                <div key={addr.id} className="card p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                        {addr.is_default && <span className="badge-gold text-xs">Default</span>}
                      </div>
                      <p className="text-sm text-gray-500">{addr.phone}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-accent-600 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {addresses.length === 0 && !addrForm && (
                <div className="text-center py-12 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                  <p>No addresses saved yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
