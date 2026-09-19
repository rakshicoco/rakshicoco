import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function ReceivablesPage() {
  const supabase = await createClient()
  
  // Fetch pending bills
  const { data: rawBills, error } = await supabase
    .from('bills')
    .select('*')
    .gt('balance_due', 0)
    .order('created_at', { ascending: false })

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, name, contact_person')

  const buyerMap = new Map((buyers || []).map((b: any) => [b.id, b]))

  const bills = (rawBills || []).map((b: any) => ({
    ...b,
    total_amount: b.total_amount ?? b.amount ?? 0,
    bill_date: b.bill_date ?? b.date ?? b.created_at,
    due_date: b.due_date ?? b.date ?? b.created_at,
    buyers: buyerMap.get(b.entity_id || b.buyer_id)
  }))

  const totalReceivables = bills ? bills.reduce((acc, bill) => acc + Number(bill.balance_due), 0) : 0;
  const hasReceivables = Boolean(!error && bills && bills.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Accounts Receivable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pending customer payments expected from buyers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-emerald-200">
              ₹{totalReceivables.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Pending collection from {bills?.length || 0} unpaid invoices</p>
          </CardContent>
        </Card>
      </div>

      {!hasReceivables ? (
        <EmptyState
          icon={TrendingUp}
          title="No outstanding receivables"
          description="All commercial sales invoices are fully settled. No overdue buyer balances."
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {bills!.map((bill: any) => (
              <div 
                key={bill.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                      {bill.buyers?.company || bill.buyers?.name || 'Customer'}
                    </h3>
                    <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {bill.id}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                    Due: ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bill Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Invoice Total</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      ₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                <Button asChild className="w-full min-h-[44px] justify-between text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white mt-1">
                  <Link href={`/dashboard/buyer-payments/new?buyer_id=${bill.buyer_id}&bill_id=${bill.id}`}>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Record Collection
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Data Table (>=768px) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Buyer</th>
                        <th className="px-4 py-3 font-medium">Bill Reference</th>
                        <th className="px-4 py-3 font-medium">Bill Date</th>
                        <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                        <th className="px-4 py-3 font-medium text-right">Balance Due</th>
                        <th className="px-4 py-3 font-medium text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bills!.map((bill: any) => (
                        <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{bill.buyers?.company || bill.buyers?.name}</div>
                            {bill.buyers?.company && <div className="text-xs text-slate-500">{bill.buyers?.name}</div>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-primary">
                            <Link href={`/dashboard/bills/${bill.id}`} className="hover:underline">
                              {bill.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-right font-medium">₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">
                            ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" asChild variant="ghost" className="text-primary hover:underline text-xs">
                              <Link href={`/dashboard/buyer-payments/new?buyer_id=${bill.buyer_id}&bill_id=${bill.id}`}>
                                Record Payment
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
