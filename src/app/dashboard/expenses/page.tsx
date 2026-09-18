import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Receipt } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function ExpensesPage() {
  const supabase = await createClient()
  
  // Fetch expenses
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Other Expenses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track operational expenses not directly tied to core operational purchases.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-4 w-4" /> Record Expense
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by category, description..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
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
                {error || !expenses || expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No general expenses recorded.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-500">{expense.id}</td>
                      <td className="px-4 py-3">{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">{expense.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{expense.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        -₹{Number(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{expense.payment_method}</td>
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
