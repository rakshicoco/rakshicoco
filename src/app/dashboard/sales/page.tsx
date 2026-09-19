import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, FileText, ArrowRight, Calendar, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function SalesPage() {
  const supabase = await createClient()
  
  // Fetch sales orders
  const { data: sales, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      buyers:buyer_id (name, contact_person)
    `)
    .order('created_at', { ascending: false })

  const hasSales = Boolean(!error && sales && sales.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sales Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage outgoing buyer orders, stock reservations, and dispatches.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/sales/new">
            <Plus className="mr-2 h-4 w-4" /> New Sales Order
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search sales orders by ID or buyer..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasSales ? (
        <EmptyState
          icon={FileText}
          title="No sales orders yet"
          description="Create your first customer sales order to reserve stock and schedule dispatches."
          actionHref="/dashboard/sales/new"
          actionLabel="New Sales Order"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {sales!.map((order: any) => (
              <div 
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {order.id}
                    </h3>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                      {order.buyers?.name || 'Direct Buyer'}
                    </p>
                    {order.buyers?.contact_person && (
                      <p className="text-xs text-slate-500">{order.buyers.contact_person}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                    (order.status === 'DISPATCHED' || order.status === 'PARTIALLY_DISPATCHED') ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Order Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      {Number(order.qty).toLocaleString()} nuts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Amount</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ₹{Number(order.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Payment</span>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                      order.payment_status === 'PAID' ? 'text-green-700 bg-green-50 dark:bg-green-950/60 dark:text-green-300' :
                      order.payment_status === 'PARTIAL' ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300' :
                      'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/sales/${order.id}`}>
                    <span>View Order Details</span>
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
                        <th className="px-4 py-3 font-medium">Order ID</th>
                        <th className="px-4 py-3 font-medium">Buyer</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                        <th className="px-4 py-3 font-medium">Order Status</th>
                        <th className="px-4 py-3 font-medium">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sales!.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary font-mono text-xs">
                            <Link href={`/dashboard/sales/${order.id}`}>{order.id}</Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{order.buyers?.name}</div>
                            <div className="text-xs text-slate-500">{order.buyers?.contact_person || '-'}</div>
                          </td>
                          <td className="px-4 py-3">{order.date ? new Date(order.date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium">{Number(order.qty).toLocaleString()}</div>
                            {order.dispatched_qty > 0 && <div className="text-xs text-slate-500">{Number(order.dispatched_qty).toLocaleString()} disp.</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{Number(order.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              (order.status === 'DISPATCHED' || order.status === 'PARTIALLY_DISPATCHED') ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              order.payment_status === 'PAID' ? 'text-green-600 bg-green-50' :
                              order.payment_status === 'PARTIAL' ? 'text-amber-600 bg-amber-50' :
                              'text-slate-600 bg-slate-100'
                            }`}>
                              {order.payment_status}
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
