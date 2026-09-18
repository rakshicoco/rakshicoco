import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function LabourPaymentsPage() {
  const supabase = await createClient()
  
  const { data: payments, error } = await supabase
    .from('labour_payments')
    .select('*')
    .order('payment_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Labour Payments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track advances and settlements for workers and teams.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/labour-payments/new">
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by worker/team ID or reference..." 
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
                  <th className="px-4 py-3 font-medium">Worker / Team ID</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !payments || payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No labour payments recorded.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">{payment.id}</td>
                      <td className="px-4 py-3">{payment.worker_or_team_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs text-slate-500">{payment.reference_type}</div>
                        <div>{payment.reference_id || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right text-red-600">₹{Number(payment.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">
                          {payment.payment_method || 'CASH'}
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
