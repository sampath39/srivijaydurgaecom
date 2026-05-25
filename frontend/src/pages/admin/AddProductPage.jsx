import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, X, Plus, Image } from 'lucide-react'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = ['Sarees','Kadi Fabrics','Dress Materials','Dupattas','Kurtas & Sets','Bedsheets','Towels','Accessories']

export default function AddProductPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = Boolean(id)

  const [form, setForm] = useState({
    name:'', brand:'', category_id:'', description:'', short_desc:'',
    price:'', discount_price:'', stock_count:'', sku:'',
    fabric:'', color:'', points_reward:'10',
    is_featured:false, is_flash_sale:false, is_active:true,
    size_options:[], images:[],
  })
  const [imageUrls, setImageUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data || []))
    if (isEdit) {
      api.get(`/products/${id}`).then(({ data }) => {
        const p = data.data
        setForm({ name:p.name||'', brand:p.brand||'', category_id:p.category_id||'', description:p.description||'', short_desc:p.short_desc||'', price:p.price||'', discount_price:p.discount_price||'', stock_count:p.stock_count||'', sku:p.sku||'', fabric:p.fabric||'', color:p.color||'', points_reward:p.points_reward||'10', is_featured:p.is_featured||false, is_flash_sale:p.is_flash_sale||false, is_active:p.is_active!==false, size_options:p.size_options||[], images:p.images||[] })
        setImageUrls(p.images||[])
      }).catch(() => navigate('/admin/products'))
    }
  }, [id])

  const uploadImage = async (file) => {
    const ext  = file.name.split('.').pop()
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleImages = async (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - imageUrls.length)
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadImage))
      const updated = [...imageUrls, ...urls]
      setImageUrls(updated)
      setForm(f => ({...f, images: updated}))
      toast.success(`${urls.length} image(s) uploaded!`)
    } catch (err) { toast.error('Image upload failed: ' + err.message) }
    setUploading(false)
  }

  const removeImage = (url) => {
    const updated = imageUrls.filter(u => u !== url)
    setImageUrls(updated)
    setForm(f => ({...f, images: updated}))
  }

  const addSize = (size) => {
    if (size && !form.size_options.includes(size)) {
      setForm(f => ({...f, size_options: [...f.size_options, size]}))
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock_count) { toast.error('Name, price and stock are required'); return }
    setSaving(true)
    try {
      const payload = { ...form, price: +form.price, discount_price: form.discount_price ? +form.discount_price : null, stock_count: +form.stock_count, points_reward: +form.points_reward || 10 }
      if (isEdit) await api.put(`/products/${id}`, payload)
      else await api.post('/products', payload)
      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      navigate('/admin/products')
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    setSaving(false)
  }

  const F = ({ label, name, type='text', required, half }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="label">{label}{required && ' *'}</label>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))}
        className="input" />
    </div>
  )

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      {/* Images */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-primary-500" /> Product Images</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {imageUrls.map(url => (
            <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-600">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-accent-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {imageUrls.length < 6 && (
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} disabled={uploading} />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400">Upload up to 6 images. First image will be the main product image.</p>
      </div>

      {/* Basic Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Product Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input" placeholder="e.g., Silk Cotton Saree - Red" /></div>
          <div><label className="label">Brand</label><input value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} className="input" placeholder="Brand name" /></div>
          <div>
            <label className="label">Category *</label>
            <select value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">SKU</label><input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} className="input" placeholder="e.g., SIL-001" /></div>
          <div><label className="label">Fabric</label><input value={form.fabric} onChange={e=>setForm(f=>({...f,fabric:e.target.value}))} className="input" placeholder="e.g., Pure Cotton, Silk" /></div>
          <div className="col-span-2"><label className="label">Short Description</label><input value={form.short_desc} onChange={e=>setForm(f=>({...f,short_desc:e.target.value}))} className="input" placeholder="One-line description for product cards" /></div>
          <div className="col-span-2"><label className="label">Full Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input h-28 resize-none" placeholder="Detailed product description..." /></div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Price (₹) *</label><input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className="input" placeholder="0.00" /></div>
          <div><label className="label">Discount Price (₹)</label><input type="number" value={form.discount_price} onChange={e=>setForm(f=>({...f,discount_price:e.target.value}))} className="input" placeholder="Leave blank if no discount" /></div>
          <div><label className="label">Stock Count *</label><input type="number" value={form.stock_count} onChange={e=>setForm(f=>({...f,stock_count:e.target.value}))} className="input" placeholder="0" /></div>
          <div><label className="label">Reward Points</label><input type="number" value={form.points_reward} onChange={e=>setForm(f=>({...f,points_reward:e.target.value}))} className="input" placeholder="10" /></div>
        </div>
      </div>

      {/* Settings */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key:'is_active',   label:'Active (Visible)' },
            { key:'is_featured', label:'Featured Product' },
            { key:'is_flash_sale',label:'Flash Sale' },
          ].map(s => (
            <label key={s.key} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-dark-600 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700">
              <input type="checkbox" checked={form[s.key]} onChange={e=>setForm(f=>({...f,[s.key]:e.target.checked}))} className="w-4 h-4 accent-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Size Options</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.size_options.map(s => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-medium">
              {s}<button onClick={() => setForm(f=>({...f,size_options:f.size_options.filter(x=>x!==s)}))}><X className="w-3 h-3"/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {['XS','S','M','L','XL','XXL','Free Size','5.5m','6m'].filter(s => !form.size_options.includes(s)).map(s => (
            <button key={s} onClick={() => addSize(s)}
              className="px-3 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button onClick={handleSubmit} disabled={saving}
          className="btn-primary py-3.5 px-10 text-base">
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        <button onClick={() => navigate('/admin/products')} className="btn-ghost py-3.5 px-6">Cancel</button>
      </div>
    </div>
  )
}
