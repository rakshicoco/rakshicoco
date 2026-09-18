import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Edit, MapPin, Phone, Calendar, Receipt, Scissors, Truck, Route } from 'lucide-react'

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // Fetch purchase
  const { data: pur, error } = await supabase
    .from('purchases')
    .select(`
      *,
      farms:farm_id (
        id,
        owner_name,
        phone,
        village
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !pur) {
    notFound()
  }

  // Generate traceability links
  const traceabilitySteps = [
    { label: "Farm", desc: pur.farm_id, active: true, icon: <MapPin className="h-4 w-4" /> },
    { label: "Purchase", desc: pur.id, active: true, icon: <Receipt className="h-4 w-4" /> },
    { label: "Cutting", desc: "View Batches", active: pur.status !== 'DRAFT', link: `/dashboard/cutting?purchase_id=${pur.id}`, icon: <Scissors className="h-4 w-4" /> },
    { label: "Grouping", desc: "View Grouping", active: pur.status !== 'DRAFT', link: `/dashboard/grouping?purchase_id=${pur.id}`, icon: <Route className="h-4 w-4" /> },
    { label: "Transport", desc: "Farm → Godown", active: pur.status !== 'DRAFT', link: `/dashboard/transport?purchase_id=${pur.id}`, icon: <Truck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center text-sm text-slate-500 mb-2">
        <Link href="/dashboard/purchases" className="hover:text-primary flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Purchases
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{pur.id}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          pur.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          pur.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          pur.status === 'HARVESTING' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
              {pur.status}
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            Transaction from {new Date(pur.purchase_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {pur.status === 'DRAFT' && (
            <Button variant="default">Confirm Purchase</Button>
          )}
          {pur.status === 'CONFIRMED' && (
            <Button variant="default">Start Harvesting</Button>
          )}
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Farm Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Farm Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Owner</p>
              <Link href={`/dashboard/farms/${pur.farm_id}`} className="text-base font-medium text-primary hover:underline">
                {pur.farms?.owner_name}
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Farm ID</p>
              <p className="text-base font-mono">{pur.farm_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Location</p>
              <p className="text-base">{pur.farms?.village}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quantities & Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quantities & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Expected Qty</span>
              <span className="font-medium">{Number(pur.expected_qty).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Actual Harvested Qty</span>
              <span className="font-medium text-primary">{Number(pur.actual_qty).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2 mt-2">
              <span className="text-sm text-slate-500">Purchase Date</span>
              <span className="font-medium">{new Date(pur.purchase_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm text-slate-500">Harvest Date</span>
              <span className="font-medium">{pur.harvest_date ? new Date(pur.harvest_date).toLocaleDateString() : 'Pending'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-500">Rate per unit</span>
              <span className="font-medium">₹{Number(pur.rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-semibold text-slate-700">Gross Amount</span>
              <span className="font-bold">₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2 mt-2">
              <span className="text-sm text-slate-500">Advance Paid</span>
              <span className="font-medium text-green-600">₹{Number(pur.advance).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-semibold text-slate-700">Balance</span>
              <span className="font-bold text-red-600">₹{Number(pur.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Traceability Timeline */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Lifecycle Traceability</CardTitle>
          <CardDescription>Track the operational flow of this specific purchase batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {traceabilitySteps.map((step, idx) => (
              <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${step.active ? 'bg-white border-primary/20 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className={`p-2 rounded-full ${step.active ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.label}</p>
                  {step.link ? (
                    <Link href={step.link} className="text-xs text-primary hover:underline">{step.desc}</Link>
                  ) : (
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  )}
                </div>
                {idx < traceabilitySteps.length - 1 && (
                  <div className="ml-2 w-4 h-[1px] bg-slate-300 hidden sm:block"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
