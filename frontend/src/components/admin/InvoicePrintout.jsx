import React from 'react'
import { format } from 'date-fns'

export default function InvoicePrintout({ invoice }) {
  if (!invoice) return null

  // Ensure items are parsed if they come as a JSON string from backend or use directly
  const items = Array.isArray(invoice.items) ? invoice.items : []

  return (
    <div className="bg-white text-black p-8 max-w-[800px] mx-auto font-sans" id="invoice-print-area">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
        <div>
          <h1 className="text-4xl font-bold font-display uppercase tracking-widest text-gray-900">INVOICE</h1>
          <p className="text-gray-500 mt-1">Receipt for your purchase</p>
        </div>
        <div className="text-right">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white text-2xl mb-2 ml-auto">
            🥻
          </div>
          <h2 className="font-bold text-xl">SVDKE Store</h2>
          <p className="text-sm text-gray-600">123 Market Street, City</p>
          <p className="text-sm text-gray-600">GST: 22AAAAA0000A1Z5</p>
          <p className="text-sm text-gray-600">Phone: +91 98765 43210</p>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase tracking-wider">Bill To:</h3>
          {invoice.customer_name ? (
            <>
              <p className="font-bold text-lg">{invoice.customer_name}</p>
              {invoice.customer_phone && <p className="text-gray-600">{invoice.customer_phone}</p>}
              {invoice.customer_email && <p className="text-gray-600">{invoice.customer_email}</p>}
              {invoice.customer_address && <p className="text-gray-600 whitespace-pre-line mt-1">{invoice.customer_address}</p>}
            </>
          ) : (
            <p className="text-gray-600 italic">Walk-in Customer</p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-gray-500 font-semibold text-sm uppercase mr-2">Invoice No:</span>
            <span className="font-bold">{invoice.invoice_number}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-500 font-semibold text-sm uppercase mr-2">Date:</span>
            <span className="font-bold">{format(new Date(invoice.created_at || Date.now()), 'dd MMM yyyy, hh:mm a')}</span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold text-sm uppercase mr-2">Payment Method:</span>
            <span className="font-bold">{invoice.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-800">
            <th className="py-3 px-4 font-bold text-gray-900 w-1/2">Item Description</th>
            <th className="py-3 px-4 font-bold text-gray-900 text-right">Price</th>
            <th className="py-3 px-4 font-bold text-gray-900 text-center">Qty</th>
            <th className="py-3 px-4 font-bold text-gray-900 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-4 px-4">
                <p className="font-medium text-gray-900">{item.product_name || item.productName}</p>
              </td>
              <td className="py-4 px-4 text-right text-gray-700">₹{Number(item.unit_price || item.unitPrice).toFixed(2)}</td>
              <td className="py-4 px-4 text-center text-gray-700">{item.quantity}</td>
              <td className="py-4 px-4 text-right font-medium text-gray-900">₹{Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{Number(invoice.discount).toFixed(2)}</span>
            </div>
          )}
          {Number(invoice.tax) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>₹{Number(invoice.tax).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 pt-3 mt-3">
            <span>Grand Total</span>
            <span>₹{Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-gray-200 pt-8 text-gray-500 text-sm">
        <p className="font-bold text-gray-700 mb-1">Thank you for your business!</p>
        <p>Goods once sold will not be taken back or exchanged unless defective.</p>
      </div>

      {/* Print CSS to ensure proper page breaks and hide everything else */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  )
}
