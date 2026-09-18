import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, AlertTriangle } from 'lucide-react'

export default async function ReceivablesPage() {
  const supabase = await createClient()
  
  // Fetch pending bills
  const { data: bills, error } = await supabase
    .from('bills')
    .select(`
      *,
      buyers:buyer_id (name, company)
    `)
    .gt('balance_due', 0)
    .order('bill_date', { ascending: true })

  // Calculate total
  const totalReceivables = bills ? bills.reduce((acc, bill) => acc + Number(bill.balance_due), 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Accounts Receivable</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Pending payments expected from buyers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-green-50 border-green-200 col-span-full md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              ₹{totalReceivables.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-green-700 mt-1">Pending from {bills?.length || 0} bills</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-green-600" /> Pending Bills & Advances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Bill Reference</th>
                  <th className="px-4 py-3 font-medium">Bill Date</th>
                  <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Balance Due</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !bills || bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No accounts receivable found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{bill.buyers?.company || bill.buyers?.name}</div>
                        {bill.buyers?.company && <div className="text-xs text-slate-500">{bill.buyers?.name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/bills/${bill.id}`} className="font-medium text-primary hover:underline">
                          {bill.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right">₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link 
                          href={`/dashboard/buyer-payments/new?buyer_id=${bill.buyer_id}&bill_id=${bill.id}`}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          Record Payment
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
