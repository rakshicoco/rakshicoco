import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  Wallet, 
  MapPin, 
  ShoppingCart,
  Factory,
  Building2,
  PackageCheck,
  TrendingDown,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Dashboard Metrics
  const { count: farmsCount } = await supabase.from('farms').select('*', { count: 'exact', head: true }).eq('active', true)
  const { count: harvestCount } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED')
  const { data: stockMovements } = await supabase.from('stock_movements').select('qty, to_state').eq('to_state', 'READY')
  const readyStock = stockMovements?.reduce((acc, curr) => acc + Number(curr.qty), 0) || 0
  const { data: bills } = await supabase.from('bills').select('balance_due').gt('balance_due', 0)
  const receivables = bills?.reduce((acc, curr) => acc + Number(curr.balance_due), 0) || 0
  const { data: purchases } = await supabase.from('purchases').select('balance').gt('balance', 0)
  const payables = purchases?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="pt-2 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Today's operations at a glance
        </p>
      </div>

      {/* KPI Cards Grid (Compact) */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col items-start">
            <div className="p-2 bg-slate-100 rounded-full mb-2">
              <Factory className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{readyStock.toLocaleString()}</div>
            <p className="text-xs text-slate-500 font-medium">Ready Stock</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col items-start">
            <div className="p-2 bg-slate-100 rounded-full mb-2">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{farmsCount || 0}</div>
            <p className="text-xs text-slate-500 font-medium">Active Farms</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-start">
            <div className="p-2 bg-green-100 rounded-full mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-900">₹{receivables.toLocaleString(undefined, {minimumFractionDigits: 0})}</div>
            <p className="text-xs text-green-700 font-medium">Receivables</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-start">
            <div className="p-2 bg-red-100 rounded-full mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-xl font-bold text-red-900">₹{payables.toLocaleString(undefined, {minimumFractionDigits: 0})}</div>
            <p className="text-xs text-red-700 font-medium">Payables</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Pulse */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3">Attention Required</h3>
      <div className="space-y-3">
        <Link href="/dashboard/purchases">
          <Card className="border-amber-200 bg-amber-50 shadow-sm hover:bg-amber-100 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold text-lg">
                  {harvestCount || 0}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pending Harvests</h4>
                  <p className="text-xs text-slate-600">Tap to manage cutting</p>
                </div>
              </div>
              <ArrowRight className="text-amber-500 h-5 w-5" />
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/sales">
          <Card className="border-blue-200 bg-blue-50 shadow-sm hover:bg-blue-100 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pending Deliveries</h4>
                  <p className="text-xs text-slate-600">Waiting for dispatch</p>
                </div>
              </div>
              <ArrowRight className="text-blue-500 h-5 w-5" />
            </CardContent>
          </Card>
        </Link>
      </div>
      
      {/* Spacer for bottom nav and fab */}
      <div className="h-8" />
    </div>
  )
}

