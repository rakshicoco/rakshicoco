import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, ShoppingCart, ArrowRight, Calendar, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function PurchasesPage() {
  const supabase = await createClient()
  
  // Fetch purchases joined with farms
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      farms:farm_id (
        owner_name,
        village
      )
    `)
    .order('created_at', { ascending: false })

  const hasPurchases = Boolean(!error && purchases && purchases.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Purchases</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage transactions from farms, quantities, and status.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/purchases/new">
            <Plus className="mr-2 h-4 w-4" /> New Purchase
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search purchases by ID or Farm..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasPurchases ? (
        <EmptyState
          icon={ShoppingCart}
          title="No purchases yet"
          description="Create your first farm harvest purchase order to begin processing."
          actionHref="/dashboard/purchases/new"
          actionLabel="New Purchase"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {purchases!.map((pur: any) => (
              <div 
                key={pur.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {pur.id}
                    </h3>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                      {pur.farms?.owner_name || 'Direct Farm'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    pur.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    pur.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                    pur.status === 'HARVESTING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {pur.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(pur.purchase_date || pur.expected_date || pur.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      {Number(pur.actual_qty || pur.actual_quantity || pur.expected_qty || pur.expected_quantity || 0).toLocaleString()} nuts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Rate</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">₹{Number(pur.rate).toFixed(2)}/nut</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Amount</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ₹{Number(pur.gross_amount || (Number(pur.expected_quantity || pur.actual_quantity || 0) * Number(pur.rate || 0))).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/purchases/${pur.id}`}>
                    <span>View Purchase Details</span>
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
                        <th className="px-4 py-3 font-medium">Purchase ID</th>
                        <th className="px-4 py-3 font-medium">Farm</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Quantity</th>
                        <th className="px-4 py-3 font-medium text-right">Rate</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {purchases!.map((pur: any) => (
                        <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary font-mono text-xs">
                            <Link href={`/dashboard/purchases/${pur.id}`}>{pur.id}</Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{pur.farms?.owner_name || 'Direct Farm'}</div>
                            <div className="text-xs text-slate-500 font-mono">{pur.farm_id}</div>
                          </td>
                          <td className="px-4 py-3">{new Date(pur.purchase_date || pur.expected_date || pur.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {Number(pur.actual_qty || pur.actual_quantity || pur.expected_qty || pur.expected_quantity || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">₹{Number(pur.rate).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium">
                            ₹{Number(pur.gross_amount || (Number(pur.expected_quantity || pur.actual_quantity || 0) * Number(pur.rate || 0))).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              pur.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              pur.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              pur.status === 'HARVESTING' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {pur.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/purchases/${pur.id}`}>View</Link>
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
