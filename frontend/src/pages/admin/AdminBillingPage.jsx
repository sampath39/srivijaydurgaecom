import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Minus, Trash2, Printer, Download, CreditCard,
  User, MapPin, Mail, Phone, PackageOpen, Tag, Banknote, History
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../lib/axios'
import InvoicePrintout from '../../components/admin/InvoicePrintout'
import html2pdf from 'html2pdf.js'

export default function AdminBillingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [cart, setCart] = useState([])
  const searchRef = useRef(null)

  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' })
  const [discountType, setDiscountType] = useState('flat') // flat, percent
  const [discountValue, setDiscountValue] = useState(0)
  const [taxValue, setTaxValue] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const [isProcessing, setIsProcessing] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0)
  const discountAmount = discountType === 'flat' ? Number(discountValue) : (subtotal * Number(discountValue) / 100)
  const finalTotal = subtotal - discountAmount + Number(taxValue)

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await api.get(`/api/pos/products?search=${encodeURIComponent(searchQuery)}`)
        if (data.success) {
          setSearchResults(data.data)
        }
      } catch (err) {
        console.error('Search error', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const addToCart = (product) => {
    if (product.stock_count <= 0) {
      toast.error('Product is out of stock')
      return
    }

    const existingItem = cart.find(item => item.productId === product.id)
    if (existingItem) {
      if (existingItem.quantity >= product.stock_count) {
        toast.error(`Insufficient stock. Only ${product.stock_count} available.`)
        return
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      const price = product.discount_price || product.price
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: price,
        quantity: 1,
        subtotal: price,
        maxStock: product.stock_count,
        image: product.images[0]
      }])
    }
    toast.success('Added to cart')
  }

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return item
        if (newQuantity > item.maxStock) {
          toast.error(`Cannot exceed available stock of ${item.maxStock}`)
          return item
        }
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
      }
      return item
    }))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    
    setIsProcessing(true)
    try {
      const payload = {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerAddress: customer.address,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: Number(taxValue),
        total: finalTotal,
        paymentMethod
      }
      const { data } = await api.post('/api/pos/checkout', payload)
      if (data.success) {
        toast.success('Invoice generated successfully!')
        setInvoice({
          ...data.data,
          items: cart,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_address: customer.address,
        })
        setShowInvoiceModal(true)
        // Reset form
        setCart([])
        setCustomer({ name: '', phone: '', email: '', address: '' })
        setDiscountValue(0)
        setTaxValue(0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print-area')
    if (!element) return
    const opt = {
      margin:       10,
      filename:     `${invoice.invoice_number}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Point of Sale</h1>
          <p className="text-gray-500 mt-1">Create bills, manage cart, and generate invoices seamlessly.</p>
        </div>
        <Link to="/admin/billing/history" className="btn-secondary px-5 py-2.5 flex items-center gap-2">
          <History className="w-5 h-5" /> View History
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Search & Cart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search Bar & Products Grid */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-premium border border-gray-100 dark:border-white/5 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Product Name, SKU, or ID..."
                className="input-primary pl-12 h-14 text-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {searchResults.length === 0 && !isSearching ? (
                <div className="col-span-full py-8 text-center text-gray-500">No products found</div>
              ) : (
                searchResults.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock_count <= 0}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      product.stock_count <= 0 
                        ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-white/5' 
                        : 'border-gray-200 dark:border-white/10 hover:border-primary-500 hover:shadow-md dark:hover:border-primary-500'
                    }`}
                  >
                    <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                    <div className="mt-auto flex items-center justify-between w-full">
                      <span className="font-bold text-primary-500">₹{product.discount_price || product.price}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.stock_count > 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {product.stock_count > 0 ? `${product.stock_count} left` : 'Out'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart Table */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <PackageOpen className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Order</h2>
            </div>
            
            {cart.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p>No items in cart. Start searching to add products.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Product</th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Qty</th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Total</th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.productName} className="w-10 h-10 object-cover rounded-md" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                              <p className="text-xs text-gray-500">{item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-900 dark:text-white">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                              <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                              <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-white">₹{item.subtotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Details */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-white/5 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary-500" /> Customer Details
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Full Name" className="input-primary pl-10 w-full" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Phone Number" className="input-primary pl-10 w-full" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" placeholder="Email Address (Optional)" className="input-primary pl-10 w-full" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea placeholder="Billing Address (Optional)" className="input-primary pl-10 py-3 w-full h-24 resize-none" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Order Summary & Actions */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-white/5 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-primary-500" /> Summary
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Discount</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDiscountType('flat')} className={`px-2 py-0.5 rounded text-xs ${discountType === 'flat' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-white/10'}`}>₹ Flat</button>
                    <button onClick={() => setDiscountType('percent')} className={`px-2 py-0.5 rounded text-xs ${discountType === 'percent' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-white/10'}`}>% Percent</button>
                  </div>
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min="0" placeholder="0.00" className="input-primary pl-10 w-full" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500 text-sm mt-1">
                    <span>Discount applied:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Tax Input */}
              <div className="space-y-2">
                <span className="text-sm text-gray-500">Tax Amount (Optional)</span>
                <input type="number" min="0" placeholder="0.00" className="input-primary w-full" value={taxValue} onChange={e => setTaxValue(e.target.value)} />
              </div>
              
              {/* Payment Method */}
              <div className="space-y-2">
                <span className="text-sm text-gray-500">Payment Method</span>
                <select className="input-primary w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Credit/Debit Card</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-2xl font-black text-primary-500">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={isProcessing || cart.length === 0}
              className="btn-primary w-full py-4 text-lg font-bold flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-6 h-6" /> Complete Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal for Print/Download */}
      {showInvoiceModal && invoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 relative"
          >
            {/* Action Bar */}
            <div className="bg-gray-50 dark:bg-dark-800 p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Successfully Generated</h3>
              <div className="flex gap-3">
                <button onClick={handleDownloadPDF} className="btn-secondary px-4 py-2 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={handlePrint} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print Bill
                </button>
                <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-gray-500 hover:text-gray-700 bg-gray-200 dark:bg-white/10 rounded-xl transition-colors ml-4">
                  <Trash2 className="w-5 h-5 hidden" /> Close
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 md:p-12 bg-white text-black max-h-[70vh] overflow-y-auto">
              <div id="invoice-print-area">
                <InvoicePrintout invoice={invoice} />
              </div>
            </div>
            
            {/* Fixed Close Button for bottom */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 text-center print:hidden">
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-500 hover:underline">Close and start new bill</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
