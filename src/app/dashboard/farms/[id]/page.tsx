import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Edit, MapPin, Phone, Calendar, History, TrendingUp, AlertCircle } from 'lucide-react'

export default async function FarmDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // Fetch farm
  const { data: farm, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !farm) {
    notFound()
  }

  // Fetch recent purchases for this farm
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('farm_id', farm.id)
    .order('purchase_date', { ascending: false })
    .limit(5)

  // Calculate some simple aggregates (in a real app, this might be a DB view or RPC)
  const totalPurchases = purchases ? purchases.length : 0;
  const totalQty = purchases ? purchases.reduce((acc, curr) => acc + Number(curr.actual_qty || curr.expected_qty), 0) : 0;
  const totalValue = purchases ? purchases.reduce((acc, curr) => acc + Number(curr.gross_amount), 0) : 0;
  const totalPaid = purchases ? purchases.reduce((acc, curr) => acc + Number(curr.advance), 0) : 0;
  const outstanding = totalValue - totalPaid;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center text-sm text-slate-500 mb-2">
        <Link href="/dashboard/farms" className="hover:text-primary flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Farms
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{farm.owner_name}&apos;s Farm</h1>
            {!farm.active && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Archived</span>
            )}
          </div>
          <p className="text-slate-500 font-mono mt-1">{farm.id}</p>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" /> Edit Details
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Phone className="mr-2 h-4 w-4 text-slate-500" /> Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Primary Phone</p>
              <p className="text-base">{farm.phone || 'Not provided'}</p>
            </div>
            {farm.alt_phone && (
              <div>
                <p className="text-sm font-medium text-slate-500">Alt Phone</p>
                <p className="text-base">{farm.alt_phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-500">Location</p>
              <div className="flex items-start mt-1">
                <MapPin className="mr-1.5 h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  {farm.village && <span className="font-medium">{farm.village}</span>}
                  {farm.village && farm.location && <span> • </span>}
                  {farm.location && <span>{farm.location}</span>}
                  {farm.address && <span className="block text-slate-500 mt-1">{farm.address}</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Cycle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-slate-500" /> Harvest Cycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Last Actual Harvest</p>
              <p className="text-base font-medium">
                {farm.actual_harvest_date ? new Date(farm.actual_harvest_date).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Expected Next Harvest</p>
              <p className="text-base font-medium text-amber-600 dark:text-amber-500">
                {farm.expected_next_harvest_date ? new Date(farm.expected_next_harvest_date).toLocaleDateString() : 'Not scheduled'}
              </p>
            </div>
            
            <Button className="w-full mt-2" variant="secondary" asChild>
              <Link href={`/dashboard/purchases/new?farm_id=${farm.id}`}>
                Schedule Purchase
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-slate-500" /> Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Total Volume</span>
              <span className="font-medium">{totalQty.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Total Value</span>
              <span className="font-medium">₹{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Amount Paid</span>
              <span className="font-medium text-green-600">₹{totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-semibold text-slate-700">Outstanding</span>
              <span className="font-bold text-red-600">₹{outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {farm.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-500">Notes & Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{farm.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Purchases */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <History className="mr-2 h-4 w-4 text-slate-500" /> Recent Purchases
          </CardTitle>
          <Button variant="link" asChild>
            <Link href={`/dashboard/purchases?farm_id=${farm.id}`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!purchases || purchases.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p>No purchases recorded for this farm yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Purchase ID</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Quantity</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchases.map((pur: any) => (
                    <tr key={pur.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/purchases/${pur.id}`}>{pur.id}</Link>
                      </td>
                      <td className="px-4 py-3">{new Date(pur.purchase_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">{Number(pur.actual_qty || pur.expected_qty).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{Number(pur.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800 font-medium">
                          {pur.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
