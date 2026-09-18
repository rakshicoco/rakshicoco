import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PnlPage() {
  const supabase = await createClient()
  
  // Calculate P&L metrics based on accrued values (Sales vs COGS + Expenses)
  
  // 1. Revenue (From Sales Orders that are not cancelled)
  const { data: sales } = await supabase.from('sales_orders').select('total').neq('status', 'CANCELLED')
  const totalRevenue = sales?.reduce((acc, s) => acc + Number(s.total), 0) || 0
  
  // 2. COGS (From Purchases)
  const { data: purchases } = await supabase.from('purchases').select('gross_amount').neq('status', 'CANCELLED')
  const totalCogs = purchases?.reduce((acc, p) => acc + Number(p.gross_amount), 0) || 0
  
  // 3. Labour
  const { data: labour } = await supabase.from('labour_payments').select('amount')
  const totalLabour = labour?.reduce((acc, l) => acc + Number(l.amount), 0) || 0
  
  // 4. Transport (Freight on dispatch or purchase)
  const { data: bills } = await supabase.from('bills').select('freight_charges')
  const freightRecovered = bills?.reduce((acc, b) => acc + Number(b.freight_charges || 0), 0) || 0
  // Note: in MVP we don't have explicit transport cost tracking yet, would come from expenses usually
  
  // 5. Operating Expenses
  const { data: expenses } = await supabase.from('expenses').select('amount')
  const totalOpex = expenses?.reduce((acc, e) => acc + Number(e.amount), 0) || 0

  // Calculations
  const grossProfit = totalRevenue - totalCogs
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  
  const totalExpenses = totalLabour + totalOpex - freightRecovered
  const netProfit = grossProfit - totalExpenses
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profit & Loss Statement</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Accrual basis financial performance overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">This Month</Button>
          <Button variant="outline">This Year</Button>
          <Button variant="secondary">All Time</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`border-2 ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg font-bold flex justify-between ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Net Profit
              <DollarSign className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ₹{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className={`text-sm mt-2 font-medium ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Net Margin: {netMargin.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-xl flex items-center">
            <PieChart className="mr-2 h-5 w-5 text-slate-500" /> Income Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* Revenue */}
            <div className="p-4 bg-white">
              <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                <span>Revenue (Sales)</span>
                <span>₹{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            {/* Cost of Goods Sold */}
            <div className="p-4 bg-slate-50">
              <div className="flex justify-between items-center text-lg font-bold text-slate-800 mb-2">
                <span>Cost of Goods Sold (COGS)</span>
                <span>₹{totalCogs.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pl-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Farm Purchases</span>
                  <span>₹{totalCogs.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            
            {/* Gross Profit */}
            <div className="p-4 bg-blue-50 border-y-2 border-blue-200">
              <div className="flex justify-between items-center text-lg font-bold text-blue-900">
                <span>Gross Profit</span>
                <span>₹{grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="text-sm text-blue-700 mt-1 text-right">Gross Margin: {grossMargin.toFixed(2)}%</div>
            </div>
            
            {/* Operating Expenses */}
            <div className="p-4 bg-slate-50">
              <div className="flex justify-between items-center text-lg font-bold text-slate-800 mb-2">
                <span>Operating Expenses</span>
                <span>₹{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pl-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Labour Costs</span>
                  <span>₹{totalLabour.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>General Expenses</span>
                  <span>₹{totalOpex.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Less: Freight Recovered</span>
                  <span>-₹{freightRecovered.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            
            {/* Net Profit */}
            <div className={`p-6 border-t-4 ${netProfit >= 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
              <div className={`flex justify-between items-center text-2xl font-black ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                <span>NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}</span>
                <span>₹{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
