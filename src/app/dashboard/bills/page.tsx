import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, FileSignature } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function BillsPage() {
  const supabase = await createClient()
  
  // Fetch bills
  const { data: bills, error } = await supabase
    .from('bills')
    .select(`
      *,
      buyers:buyer_id (name, company)
    `)
    .order('bill_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bills & Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage commercial invoices generated from dispatch records.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/bills/new">
            <Plus className="mr-2 h-4 w-4" /> Create Bill
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by Bill No, Buyer, or Sales Order..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Bill No</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">SO / Dispatch</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Balance Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !bills || bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileSignature className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No bills found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/bills/${bill.id}`}>{bill.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{bill.buyers?.name}</div>
                        <div className="text-xs text-slate-500">{bill.buyers?.company || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>SO: <Link href={`/dashboard/sales/${bill.sales_order_id}`} className="hover:underline">{bill.sales_order_id}</Link></div>
                        {bill.dispatch_id && <div>Disp: <Link href={`/dashboard/dispatch/${bill.dispatch_id}`} className="hover:underline">{bill.dispatch_id}</Link></div>}
                      </td>
                      <td className="px-4 py-3">{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        ₹{Number(bill.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        ₹{Number(bill.balance_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          bill.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {bill.status}
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
