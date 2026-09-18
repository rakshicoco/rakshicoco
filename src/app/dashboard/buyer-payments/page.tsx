import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Banknote } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function BuyerPaymentsPage() {
  const supabase = await createClient()
  
  // Fetch payments
  const { data: payments, error } = await supabase
    .from('buyer_payments')
    .select(`
      *,
      buyers:buyer_id (name, company)
    `)
    .order('payment_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Buyer Payments (Inward)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track inward cash flow from buyers against sales orders and bills.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/buyer-payments/new">
            <Plus className="mr-2 h-4 w-4" /> Record Receipt
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by Payment ID, Buyer, or Bill Ref..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Payment ID</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">References</th>
                  <th className="px-4 py-3 font-medium text-right">Amount Received</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !payments || payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Banknote className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No buyer payments recorded.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">{payment.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{payment.buyers?.name}</div>
                        <div className="text-xs text-slate-500">{payment.buyers?.company || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">{payment.payment_method}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {payment.sales_order_id && <div>SO: <Link href={`/dashboard/sales/${payment.sales_order_id}`} className="hover:underline">{payment.sales_order_id}</Link></div>}
                        {payment.bill_id && <div>Bill: <Link href={`/dashboard/bills/${payment.bill_id}`} className="hover:underline">{payment.bill_id}</Link></div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        +₹{Number(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {payment.status}
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
