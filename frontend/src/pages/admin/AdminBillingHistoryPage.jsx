import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, FileText, Download, Printer, Eye, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import InvoicePrintout from '../../components/admin/InvoicePrintout'
import html2pdf from 'html2pdf.js'

export default function AdminBillingHistoryPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      let query = supabase.from('invoices').select('*', { count: 'exact' })
      
      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
      }
      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00.000Z')
      }
      if (endDate) {
        query = query.gte('created_at', endDate + 'T23:59:59.999Z') // wait this should be lte
      }
      // fix endDate logic inside the same chunk:
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z')
      }

      const from = (page - 1) * 10
      const to = page * 10 - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setInvoices(data || [])
      setTotalPages(Math.ceil((count || 0) / 10) || 1)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch billing history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  const viewInvoice = async (id) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      setSelectedInvoice(data)
      setShowModal(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch invoice details')
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
      filename:     `${selectedInvoice.invoice_number}.pdf`,
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
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Link to="/admin/billing" className="text-gray-400 hover:text-primary-500 transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </Link>
            Billing History
          </h1>
          <p className="text-gray-500 mt-1 ml-11">View past invoices and reprint bills.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Name, or Phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-primary pl-10 w-full"
          />
          <button type="submit" className="hidden" />
        </form>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="date" 
            className="input-primary flex-1 md:w-auto" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
          />
          <span className="text-gray-400">to</span>
          <input 
            type="date" 
            className="input-primary flex-1 md:w-auto" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
          />
          <button onClick={handleSearch} className="btn-primary px-4 py-2">Filter</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium border border-gray-100 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p>No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Invoice #</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5">
                    <td className="p-4">
                      <span className="font-medium text-primary-600 dark:text-primary-400">{inv.invoice_number}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900 dark:text-white">{inv.customer_name || 'Walk-in'}</p>
                      <p className="text-xs text-gray-500">{inv.customer_phone}</p>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {format(new Date(inv.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      ₹{Number(inv.total).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewInvoice(inv.id)} className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors" title="View Invoice">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Invoice Modal for Print/Download */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 relative"
          >
            {/* Action Bar */}
            <div className="bg-gray-50 dark:bg-dark-800 p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Details</h3>
              <div className="flex gap-3">
                <button onClick={handleDownloadPDF} className="btn-secondary px-4 py-2 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={handlePrint} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print Bill
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:text-gray-700 bg-gray-200 dark:bg-white/10 rounded-xl transition-colors ml-4">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 md:p-12 bg-white text-black max-h-[70vh] overflow-y-auto">
              <div id="invoice-print-area">
                <InvoicePrintout invoice={selectedInvoice} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
