import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, CreditCard, Calendar, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function LabourPaymentsPage() {
  const supabase = await createClient()
  
  const { data: payments, error } = await supabase
    .from('labour_payments')
    .select('*')
    .order('payment_date', { ascending: false })

  const hasPayments = Boolean(!error && payments && payments.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Labour Payments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track advances and settlements for workers and teams.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/labour-payments/new">
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by worker/team ID..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasPayments ? (
        <EmptyState
          icon={CreditCard}
          title="No labour payments yet"
          description="Record wage settlements, advances, or cutting allowances for your workforce."
          actionHref="/dashboard/labour-payments/new"
          actionLabel="Record Payment"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {payments!.map((payment: any) => (
              <div 
                key={payment.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {payment.id}
                    </h3>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {payment.worker_or_team_id || 'Labour'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                    {payment.payment_method || 'CASH'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Reference</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {payment.reference_type || 'General'} {payment.reference_id ? `(${payment.reference_id})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Amount Paid</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ₹{Number(payment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Balance Outstanding</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                      ₹{Number(payment.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments!.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
