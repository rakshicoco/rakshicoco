import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, PackageCheck, ArrowRight, Calendar, Truck, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function DispatchPage() {
  const supabase = await createClient()
  
  // Fetch dispatches
  const { data: dispatches, error } = await supabase
    .from('dispatch')
    .select(`
      *,
      sales_orders:sales_order_id (buyer_id),
      workers:driver_id (name)
    `)
    .order('dispatch_date', { ascending: false })

  const hasDispatches = Boolean(!error && dispatches && dispatches.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dispatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage outbound deliveries for sales orders.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/dispatch/new">
            <Plus className="mr-2 h-4 w-4" /> Schedule Dispatch
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by Dispatch ID, SO, Vehicle..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasDispatches ? (
        <EmptyState
          icon={PackageCheck}
          title="No dispatch records yet"
          description="Schedule your first dispatch from confirmed sales orders to deliver products to buyers."
          actionHref="/dashboard/dispatch/new"
          actionLabel="Schedule Dispatch"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {dispatches!.map((disp: any) => (
              <div 
                key={disp.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {disp.id}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      SO: <Link href={`/dashboard/sales/${disp.sales_order_id}`} className="text-primary font-medium hover:underline">{disp.sales_order_id}</Link>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    disp.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    disp.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {disp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Vehicle</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {disp.vehicle || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Driver</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {disp.workers?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Dispatched Qty</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {Number(disp.qty_dispatched || 0).toLocaleString()} nuts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivered Qty</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {Number(disp.qty_delivered || 0).toLocaleString()} nuts
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/dispatch/${disp.id}`}>
                    <span>View Dispatch Details</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Dispatch ID</th>
                  <th className="px-4 py-3 font-medium">Sales Order</th>
                  <th className="px-4 py-3 font-medium">Vehicle / Driver</th>
                  <th className="px-4 py-3 font-medium">Dispatch Date</th>
                  <th className="px-4 py-3 font-medium text-right">Dispatched Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Delivered Qty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dispatches!.map((disp: any) => (
                  <tr key={disp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link href={`/dashboard/dispatch/${disp.id}`}>{disp.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/sales/${disp.sales_order_id}`} className="hover:underline text-slate-900 font-medium">
                        {disp.sales_order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{disp.vehicle || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{disp.workers?.name || 'Unassigned'}</div>
                    </td>
                    <td className="px-4 py-3">{disp.dispatch_date ? new Date(disp.dispatch_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(disp.qty_dispatched).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{Number(disp.qty_delivered).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        disp.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                        disp.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {disp.status}
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
