import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownLeft, ArrowUpRight, Wallet, Activity } from 'lucide-react'

export default async function CashFlowPage() {
  const supabase = await createClient()
  
  // In a real application, we would use an RPC or complex view to merge all cash movements
  // For the UI demonstration, we'll fetch from the separate tables and merge in JS
  
  const { data: inward } = await supabase.from('buyer_payments').select('*').order('payment_date', { ascending: false }).limit(20)
  const { data: farmOut } = await supabase.from('farm_payments').select('*').order('payment_date', { ascending: false }).limit(20)
  const { data: labourOut } = await supabase.from('labour_payments').select('*').order('payment_date', { ascending: false }).limit(20)
  const { data: expenseOut } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(20)

  // Merge and sort
  const combined = [
    ...(inward || []).map((p: any) => ({ ...p, date: p.payment_date, type: 'IN', source: 'Buyer Payment', ref: p.id, amount: Number(p.amount) })),
    ...(farmOut || []).map((p: any) => ({ ...p, date: p.payment_date, type: 'OUT', source: 'Farm Payment', ref: p.id, amount: Number(p.amount) })),
    ...(labourOut || []).map((p: any) => ({ ...p, date: p.payment_date, type: 'OUT', source: 'Labour Payment', ref: p.id, amount: Number(p.amount) })),
    ...(expenseOut || []).map((p: any) => ({ ...p, date: p.expense_date, type: 'OUT', source: 'Expense', ref: p.id, amount: Number(p.amount) })),
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50)

  const totalIn = inward?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0
  const totalOut = (farmOut?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0) + 
                   (labourOut?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0) + 
                   (expenseOut?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0)

  const netCash = totalIn - totalOut

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cash Flow Statement</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Monitor all money coming in and going out of the business.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
              Net Position <Wallet className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netCash.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total Inward - Total Outward</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex justify-between">
              Total Inward <ArrowDownLeft className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              ₹{totalIn.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex justify-between">
              Total Outward <ArrowUpRight className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              ₹{totalOut.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center">
            <Activity className="mr-2 h-5 w-5 text-slate-500" /> Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Source / Category</th>
                  <th className="px-4 py-3 font-medium">Payment Method</th>
                  <th className="px-4 py-3 font-medium text-right">Inward</th>
                  <th className="px-4 py-3 font-medium text-right">Outward</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {combined.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <p>No cash transactions found.</p>
                    </td>
                  </tr>
                ) : (
                  combined.map((tx: any, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{tx.date ? new Date(tx.date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 font-medium text-slate-500">{tx.ref}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          tx.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{tx.payment_method || 'CASH'}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {tx.type === 'IN' ? `+₹${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {tx.type === 'OUT' ? `-₹${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
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
