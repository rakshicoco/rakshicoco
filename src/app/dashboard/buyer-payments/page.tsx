import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, Banknote, Calendar, CreditCard, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function BuyerPaymentsPage() {
  const supabase = await createClient()
  
  // Fetch payments
  const { data: rawPayments, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, name, contact_person')

  const buyerMap = new Map((buyers || []).map((b: any) => [b.id, b]))

  const payments = (rawPayments || [])
    .filter((p: any) => p.type === 'IN' || p.type === 'INWARD' || p.entity_type === 'BUYER')
    .map((p: any) => ({
      ...p,
      payment_date: p.payment_date ?? p.date ?? p.created_at,
      status: p.status ?? 'COMPLETED',
      buyers: buyerMap.get(p.entity_id || p.buyer_id)
    }))

  const hasPayments = Boolean(!error && payments && payments.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Buyer Payments (Inward)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track inward cash flow from buyers against sales orders and bills.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/buyer-payments/new">
            <Plus className="mr-2 h-4 w-4" /> Record Receipt
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by Payment ID, Buyer..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasPayments ? (
        <EmptyState
          icon={Banknote}
          title="No buyer payments yet"
          description="Record incoming payments from buyers to settle pending sales receivables."
          actionHref="/dashboard/buyer-payments/new"
          actionLabel="Record Receipt"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {payments!.map((payment: any) => (
              <div 
                key={payment.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {payment.id}
                    </h3>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                      {payment.buyers?.name || 'Direct Buyer'}
                      {payment.buyers?.company ? ` (${payment.buyers.company})` : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {payment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Method</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      {payment.payment_method || 'CASH'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Amount Received</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      +₹{Number(payment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  {(payment.sales_order_id || payment.bill_id) && (
                    <div className="col-span-2 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                      {payment.sales_order_id && <span>SO: <span className="font-mono text-slate-700 dark:text-slate-300">{payment.sales_order_id}</span></span>}
                      {payment.bill_id && <span>Bill: <span className="font-mono text-slate-700 dark:text-slate-300">{payment.bill_id}</span></span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Payment ID</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">References</th>
                  <th className="px-4 py-3 font-medium text-right">Amount Received</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments!.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-primary">{payment.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{payment.buyers?.name}</div>
                      <div className="text-xs text-slate-500">{payment.buyers?.company || '-'}</div>
                    </td>
                    <td className="px-4 py-3">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">{payment.payment_method}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {payment.sales_order_id && <div>SO: <Link href={`/dashboard/sales/${payment.sales_order_id}`} className="hover:underline">{payment.sales_order_id}</Link></div>}
                      {payment.bill_id && <div>Bill: <Link href={`/dashboard/bills/${payment.bill_id}`} className="hover:underline">{payment.bill_id}</Link></div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      +₹{Number(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
