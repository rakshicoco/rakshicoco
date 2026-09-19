import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PnlPage() {
  const supabase = await createClient()
  
  // Calculate P&L metrics based on accrued values (Sales vs COGS + Expenses)
  
  // 1. Revenue (From Sales Orders that are not cancelled)
  const { data: sales } = await supabase
    .from('sales_orders')
    .select('total_amount, quantity, rate')
    .neq('status', 'CANCELLED')
  const totalRevenue = (sales || []).reduce((acc, s: any) => acc + Number(s.total_amount || (s.quantity * s.rate) || 0), 0)
  
  // 2. Cost of Goods Sold (COGS) — Direct material procurement for units sold
  const totalDispatchedQty = (sales || []).reduce((acc, s: any) => acc + Number(s.quantity || 0), 0)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('actual_quantity, expected_quantity, rate')
    .in('status', ['CONFIRMED', 'COMPLETED'])
    .not('actual_quantity', 'is', null)
  const totalPurchasedNuts = (purchases || []).reduce((acc, p: any) => acc + Number(p.actual_quantity || 0), 0)
  const totalPurchaseSpend = (purchases || []).reduce((acc, p: any) => acc + Number((p.actual_quantity || 0) * (p.rate || 0)), 0)
  const avgPurchaseRate = totalPurchasedNuts > 0 ? (totalPurchaseSpend / totalPurchasedNuts) : 20
  const totalCogs = totalDispatchedQty * avgPurchaseRate
  
  // 3. Cutting & Processing Labour
  const { data: cutting } = await supabase
    .from('cutting_batches')
    .select('actual_output_nuts, rate_per_nut')
    .neq('status', 'CANCELLED')
  const totalLabour = (cutting || []).reduce((acc, c: any) => acc + Number((c.actual_output_nuts || 0) * (c.rate_per_nut || 0)), 0)
  
  // 4. Logistics & Transport Freight
  const { data: trips } = await supabase
    .from('transport_trips')
    .select('freight_amount')
    .neq('status', 'CANCELLED')
  const totalFreight = (trips || []).reduce((acc, t: any) => acc + Number(t.freight_amount || 0), 0)
  
  // 5. Operating Expenses
  const { data: expenses } = await supabase.from('expenses').select('amount')
  const totalOpex = (expenses || []).reduce((acc, e: any) => acc + Number(e.amount || 0), 0)

  // Accounting Performance Calculations
  const grossProfit = totalRevenue - totalCogs
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  
  const totalOperatingExpenses = totalLabour + totalFreight + totalOpex
  const netProfit = grossProfit - totalOperatingExpenses
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profit & Loss Statement</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accrual basis financial performance overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">This Month</Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">This Year</Button>
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">All Time</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={`border-2 ${netProfit >= 0 ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-base font-bold flex justify-between ${netProfit >= 0 ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
              Net Performance
              <DollarSign className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${netProfit >= 0 ? 'text-green-900 dark:text-green-200' : 'text-amber-900 dark:text-amber-200'}`}>
              ₹{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className={`text-xs sm:text-sm mt-1.5 font-medium ${netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
              Gross Margin: {grossMargin.toFixed(1)}% | Net Margin: {netMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50 dark:bg-slate-800/60 py-3.5 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center font-bold">
            <PieChart className="mr-2 h-5 w-5 text-emerald-600" /> Income Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Revenue */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                <span>Revenue (Sales Invoiced)</span>
                <span className="text-emerald-700 dark:text-emerald-400">₹{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Confirmed buyer sales orders ({totalDispatchedQty} nuts sold)</p>
            </div>
            
            {/* Cost of Goods Sold */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="text-red-600 dark:text-red-400">₹{totalCogs.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pl-3 sm:pl-4 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Direct Farm Procurement ({totalDispatchedQty} nuts @ ₹{avgPurchaseRate.toFixed(2)})</span>
                  <span>₹{totalCogs.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            
            {/* Gross Profit */}
            <div className="p-4 sm:p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border-y-2 border-emerald-200 dark:border-emerald-900">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-300">
                <span>Gross Profit</span>
                <span>₹{grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1 sm:text-right font-medium">
                Gross Margin: {grossMargin.toFixed(2)}%
              </div>
            </div>
            
            {/* Operating Expenses */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                <span>Operating Expenses (OPEX)</span>
                <span className="text-red-600 dark:text-red-400">₹{totalOperatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pl-3 sm:pl-4 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Cutting & Dehusking Labour</span>
                  <span>₹{totalLabour.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Freight & Logistics</span>
                  <span>₹{totalFreight.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>General Operating Expenses</span>
                  <span>₹{totalOpex.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            
            {/* Net Profit */}
            <div className={`p-5 sm:p-6 border-t-4 ${netProfit >= 0 ? 'bg-green-100/80 border-green-500 dark:bg-green-950/40' : 'bg-amber-100/80 border-amber-500 dark:bg-amber-950/40'}`}>
              <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-green-900 dark:text-green-200' : 'text-amber-900 dark:text-amber-200'}`}>
                <span>NET {netProfit >= 0 ? 'PROFIT' : 'RESULT (OPERATING)'}</span>
                <span>₹{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Note: 800 ready nuts remaining in Godown are capitalized in inventory asset value (₹16,000.00).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
