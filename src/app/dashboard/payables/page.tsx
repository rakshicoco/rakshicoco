import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, AlertTriangle, ArrowRight, DollarSign, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function PayablesPage() {
  const supabase = await createClient()
  
  // Fetch pending purchases
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      farms:farm_id (owner_name, phone)
    `)
    .gt('balance', 0)
    .order('purchase_date', { ascending: true })

  const totalPayables = purchases ? purchases.reduce((acc: number, pur: any) => acc + Number(pur.balance), 0) : 0;
  const hasPayables = Boolean(!error && purchases && purchases.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Accounts Payable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pending settlements owed to coconut farmers and harvesting suppliers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-red-50/70 dark:bg-red-950/40 border-red-200/80 dark:border-red-900/50">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Total Payables</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-red-950 dark:text-red-200">
              ₹{totalPayables.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">Owed across {purchases?.length || 0} harvest purchases</p>
          </CardContent>
        </Card>
      </div>

      {!hasPayables ? (
        <EmptyState
          icon={TrendingDown}
          title="No outstanding payables"
          description="All farmer purchases and supplier advances are completely paid up to date."
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {purchases!.map((pur: any) => (
              <div 
                key={pur.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                      {pur.farms?.owner_name || 'Farmer'}
                    </h3>
                    <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {pur.id}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                    Owed: ₹{Number(pur.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {pur.purchase_date ? new Date(pur.purchase_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Value</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      ₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Advance Paid</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{Number(pur.advance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                      {pur.farms?.phone || '-'}
                    </span>
                  </div>
                </div>

                <Button asChild className="w-full min-h-[44px] justify-between text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white mt-1">
                  <Link href={`/dashboard/farm-payments/new?farm_id=${pur.farm_id}&purchase_id=${pur.id}`}>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Disburse Payment
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
                        <th className="px-4 py-3 font-medium">Farm Owner</th>
                        <th className="px-4 py-3 font-medium">Purchase Ref</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Total Value</th>
                        <th className="px-4 py-3 font-medium text-right">Paid Advance</th>
                        <th className="px-4 py-3 font-medium text-right">Balance Owed</th>
                        <th className="px-4 py-3 font-medium text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {purchases!.map((pur: any) => (
                        <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{pur.farms?.owner_name}</div>
                            <div className="text-xs text-slate-500">{pur.farms?.phone || '-'}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-primary">
                            <Link href={`/dashboard/purchases/${pur.id}`} className="hover:underline">
                              {pur.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{pur.purchase_date ? new Date(pur.purchase_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-right font-medium">₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">₹{Number(pur.advance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">
                            ₹{Number(pur.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" asChild variant="ghost" className="text-primary hover:underline text-xs">
                              <Link href={`/dashboard/farm-payments/new?farm_id=${pur.farm_id}&purchase_id=${pur.id}`}>
                                Make Payment
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
