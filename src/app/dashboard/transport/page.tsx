import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function TransportPage() {
  const supabase = await createClient()
  
  // Fetch transport trips
  const { data: trips, error } = await supabase
    .from('transport_trips')
    .select(`
      *,
      workers:driver_id (name)
    `)
    .order('loading_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Transport & Logistics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track farm-to-godown and godown-to-buyer trips.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transport/new">
            <Plus className="mr-2 h-4 w-4" /> New Transport Trip
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by Trip ID, Vehicle, or Driver..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
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
                {error || !trips || trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Truck className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No transport trips found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trips.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
