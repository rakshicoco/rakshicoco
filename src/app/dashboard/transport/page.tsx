import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Truck, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function TransportPage() {
  const supabase = await createClient()
  
  // Fetch transport trips
  const { data: trips, error } = await supabase
    .from('transport_trips')
    .select(`
      *,
      workers:driver_id (name)
    `)
    .order('created_at', { ascending: false })

  const hasTrips = Boolean(!error && trips && trips.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Transport & Logistics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track farm-to-godown and godown-to-buyer transit batches.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/transport/new">
            <Plus className="mr-2 h-4 w-4" /> New Transport Trip
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by Trip ID, Vehicle, or Driver..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasTrips ? (
        <EmptyState
          icon={Truck}
          title="No transport trips yet"
          description="Log transit batches between coconut farms and the central godown facility."
          actionHref="/dashboard/transport/new"
          actionLabel="New Transport Trip"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {trips!.map((trip: any) => (
              <div 
                key={trip.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {trip.id}
                    </h3>
                    <div className="mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        {trip.type === 'FARM_TO_GODOWN' ? 'Farm → Godown' : 'Godown → Buyer'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    trip.status === 'RECEIVED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    trip.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {trip.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Vehicle</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {trip.vehicle || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Driver</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      {trip.workers?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Loaded Qty</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {Number(trip.loaded_qty).toLocaleString()} nuts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Received Qty</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {Number(trip.received_qty).toLocaleString()} nuts
                    </span>
                  </div>
                </div>

                {Number(trip.difference) > 0 && (
                  <div className="flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Difference: <strong>-{Number(trip.difference)} nuts</strong> {trip.diff_reason ? `(${trip.diff_reason})` : ''}</span>
                  </div>
                )}

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/transport/${trip.id}`}>
                    <span>View Trip Details</span>
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
                        <th className="px-4 py-3 font-medium">Trip ID</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Vehicle & Driver</th>
                        <th className="px-4 py-3 font-medium text-right">Loaded Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Received Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Diff</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {trips!.map((trip: any) => (
                        <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary font-mono text-xs">
                            <Link href={`/dashboard/transport/${trip.id}`}>{trip.id}</Link>
                            {trip.purchase_id && <div className="text-xs text-slate-500 font-normal mt-1">Pur: {trip.purchase_id}</div>}
                            {trip.sales_order_id && <div className="text-xs text-slate-500 font-normal mt-1">SO: {trip.sales_order_id}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700">
                              {trip.type === 'FARM_TO_GODOWN' ? 'Farm → Godown' : 'Godown → Buyer'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{trip.vehicle || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{trip.workers?.name || 'Unassigned'}</div>
                          </td>
                          <td className="px-4 py-3 text-right">{Number(trip.loaded_qty).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">{Number(trip.received_qty).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {Number(trip.difference) > 0 ? (
                              <span className="text-red-600 font-bold">-{Number(trip.difference)}</span>
                            ) : (
                              <span className="text-green-600 font-medium">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              trip.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                              trip.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {trip.status}
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
