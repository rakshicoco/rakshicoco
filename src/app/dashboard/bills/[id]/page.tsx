import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Edit, MapPin, Phone, Download, Printer } from 'lucide-react'

export default async function BillDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // Fetch bill
  const { data: bill, error } = await supabase
    .from('bills')
    .select(`
      *,
      buyers:buyer_id (
        id,
        name,
        company,
        phone,
        address,
        city,
        state,
        gstin
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !bill) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center text-sm text-slate-500 mb-2 hidden print:hidden">
        <Link href="/dashboard/bills" className="hover:text-primary flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Bills
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Invoice {bill.id}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          bill.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
              {bill.status}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {bill.status !== 'PAID' && (
            <Button variant="default" asChild>
              <Link href={`/dashboard/buyer-payments/new?buyer_id=${bill.buyer_id}&bill_id=${bill.id}`}>
                Record Payment
              </Link>
            </Button>
          )}
          <Button variant="outline" className="print:hidden">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice Document Design */}
      <div className="bg-white p-8 md:p-12 border rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">RAKSHI COCO</h2>
            <p className="text-slate-500 text-sm mt-1">High Quality Coconuts & Produce</p>
            <div className="text-sm text-slate-600 mt-4 space-y-1">
              <p>123 Farm Road, Coconut District</p>
              <p>Tamil Nadu, India</p>
              <p>Phone: +91 98765 43210</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-light text-slate-400 mb-2">INVOICE</h1>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-left">
              <span className="font-semibold text-slate-700">Invoice No:</span>
              <span>{bill.id}</span>
              
              <span className="font-semibold text-slate-700">Date:</span>
              <span>{new Date(bill.bill_date).toLocaleDateString()}</span>
              
              <span className="font-semibold text-slate-700">Sales Order:</span>
              <span>{bill.sales_order_id}</span>
              
              {bill.dispatch_id && (
                <>
                  <span className="font-semibold text-slate-700">Dispatch:</span>
                  <span>{bill.dispatch_id}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
          <div className="text-slate-900">
            <p className="font-bold text-lg">{bill.buyers?.company || bill.buyers?.name}</p>
            {bill.buyers?.company && <p className="text-slate-600">{bill.buyers?.name}</p>}
            <p className="text-slate-600 whitespace-pre-line mt-1">{bill.buyers?.address}</p>
            <p className="text-slate-600">{bill.buyers?.city}{bill.buyers?.state ? `, ${bill.buyers?.state}` : ''}</p>
            {bill.buyers?.phone && <p className="text-slate-600 mt-1">Phone: {bill.buyers?.phone}</p>}
            {bill.buyers?.gstin && <p className="text-slate-600 mt-1 font-mono text-sm">GSTIN: {bill.buyers?.gstin}</p>}
          </div>
        </div>

        {/* Line Items - MVP only has summary line */}
        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-t bg-slate-50">
                <th className="py-3 px-4 font-semibold text-sm text-slate-700">Description</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-700 text-right">Qty</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-700 text-right">Rate</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-700 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-4 text-slate-900">Coconut Dispatch (Ref: {bill.dispatch_id || bill.sales_order_id})</td>
                <td className="py-4 px-4 text-right text-slate-900">{Number(bill.qty).toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-slate-900">₹{Number(bill.rate).toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-medium text-slate-900">₹{(Number(bill.qty) * Number(bill.rate)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900 font-medium">₹{(Number(bill.qty) * Number(bill.rate)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            
            {Number(bill.freight_charges) > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Freight Charges</span>
                <span className="text-slate-900 font-medium">₹{Number(bill.freight_charges).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
            
            {Number(bill.discount) > 0 && (
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>Discount</span>
                <span className="font-medium">-₹{Number(bill.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
            
            <div className="flex justify-between py-4 border-b-2 border-slate-900">
              <span className="text-lg font-bold text-slate-900">Total Amount</span>
              <span className="text-lg font-bold text-slate-900">₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            
            <div className="flex justify-between py-2 mt-2">
              <span className="text-sm text-slate-600">Amount Paid</span>
              <span className="text-sm text-slate-900">₹{(Number(bill.total_amount) - Number(bill.balance_due)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            
            <div className="flex justify-between py-2 bg-slate-50 px-2 rounded mt-1">
              <span className="font-semibold text-slate-900">Balance Due</span>
              <span className="font-bold text-red-600">₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-slate-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">For payment queries, contact accounts@rakshicoco.com or +91 98765 43210.</p>
        </div>
      </div>
    </div>
  )
}
