import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, AlertTriangle } from 'lucide-react'

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

  // Calculate total
  const totalPayables = purchases ? purchases.reduce((acc: number, pur: any) => acc + Number(pur.balance), 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Accounts Payable</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Pending payments owed to farmers and suppliers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-red-50 border-red-200 col-span-full md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              ₹{totalPayables.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-red-700 mt-1">Owed across {purchases?.length || 0} purchases</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center">
            <TrendingDown className="mr-2 h-5 w-5 text-red-600" /> Pending Farm Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                {error || !purchases || purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No accounts payable found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur: any) => (
                    <tr key={pur.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{pur.farms?.owner_name}</div>
                        <div className="text-xs text-slate-500">{pur.farms?.phone || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/purchases/${pur.id}`} className="font-medium text-primary hover:underline">
                          {pur.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{pur.purchase_date ? new Date(pur.purchase_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right">₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right text-green-600">₹{Number(pur.advance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        ₹{Number(pur.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link 
                          href={`/dashboard/farm-payments/new?farm_id=${pur.farm_id}&purchase_id=${pur.id}`}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          Make Payment
                        </Link>
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
