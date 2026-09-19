import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Receipt, Calendar, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function ExpensesPage() {
  const supabase = await createClient()
  
  // Fetch expenses
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })

  const hasExpenses = Boolean(!error && expenses && expenses.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Other Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational overheads, vehicle maintenance, and general business costs.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-4 w-4" /> Record Expense
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by category, description..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasExpenses ? (
        <EmptyState
          icon={Receipt}
          title="No expenses recorded yet"
          description="Log operational costs and overheads to calculate accurate net profit margins."
          actionHref="/dashboard/expenses/new"
          actionLabel="Record Expense"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {expenses!.map((expense: any) => (
              <div 
                key={expense.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Tag className="w-3 h-3" />
                      {expense.category || 'General'}
                    </span>
                    <p className="font-mono text-xs text-slate-400 mt-1">{expense.id}</p>
                  </div>
                  <span className="text-base font-bold text-red-600 dark:text-red-400">
                    -₹{Number(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {expense.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {expense.payment_method || 'Cash'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Expense ID</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                        <th className="px-4 py-3 font-medium">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenses!.map((expense: any) => (
                        <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-500 font-mono text-xs">{expense.id}</td>
                          <td className="px-4 py-3">{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 font-medium">{expense.category}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{expense.description}</td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            -₹{Number(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{expense.payment_method}</td>
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
