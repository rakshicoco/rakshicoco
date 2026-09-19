import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, FileSignature, ArrowRight, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function BillsPage() {
  const supabase = await createClient()
  
  // Fetch bills
  const { data: rawBills, error } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, name, contact_person')

  const buyerMap = new Map((buyers || []).map((b: any) => [b.id, b]))

  const bills = (rawBills || []).map((b: any) => ({
    ...b,
    total_amount: b.total_amount ?? b.amount ?? 0,
    bill_date: b.bill_date ?? b.date ?? b.created_at,
    buyers: buyerMap.get(b.entity_id || b.buyer_id)
  }))

  const hasBills = Boolean(!error && bills && bills.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bills & Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Commercial invoices generated from dispatches and customer receivables.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/bills/new">
            <Plus className="mr-2 h-4 w-4" /> Create Bill
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by Bill No, Buyer, or Sales Order..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasBills ? (
        <EmptyState
          icon={FileSignature}
          title="No bills or invoices yet"
          description="Generate commercial invoices from delivered sales dispatches."
          actionHref="/dashboard/bills/new"
          actionLabel="Create Bill"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {bills!.map((bill: any) => (
              <div 
                key={bill.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {bill.id}
                    </h3>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                      {bill.buyers?.name || 'Customer'}
                    </p>
                    {bill.buyers?.contact_person && (
                      <p className="text-xs text-slate-500">{bill.buyers.contact_person}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    bill.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {bill.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bill Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Linked Order</span>
                    <span className="font-medium font-mono text-slate-800 dark:text-slate-200 text-sm">
                      {bill.sales_order_id ? `SO: ${bill.sales_order_id}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Amount</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Balance Due</span>
                    <span className={`font-bold text-sm ${Number(bill.balance_due) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/bills/${bill.id}`}>
                    <span>View Commercial Invoice</span>
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
                        <th className="px-4 py-3 font-medium">Bill No</th>
                        <th className="px-4 py-3 font-medium">Buyer</th>
                        <th className="px-4 py-3 font-medium">SO / Dispatch</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                        <th className="px-4 py-3 font-medium text-right">Balance Due</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bills!.map((bill: any) => (
                        <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary font-mono text-xs">
                            <Link href={`/dashboard/bills/${bill.id}`}>{bill.id}</Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{bill.buyers?.name}</div>
                            <div className="text-xs text-slate-500">{bill.buyers?.contact_person || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div>SO: <Link href={`/dashboard/sales/${bill.sales_order_id}`} className="hover:underline">{bill.sales_order_id}</Link></div>
                            {bill.dispatch_id && <div>Disp: <Link href={`/dashboard/dispatch/${bill.dispatch_id}`} className="hover:underline">{bill.dispatch_id}</Link></div>}
                          </td>
                          <td className="px-4 py-3">{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            ₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              bill.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {bill.status}
                            </span>
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
