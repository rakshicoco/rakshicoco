import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  Warehouse, 
  MapPin, 
  ShoppingCart,
  PackageCheck,
  ArrowRight,
  Plus,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Dashboard Metrics
  const { count: farmsCount } = await supabase.from('farms').select('*', { count: 'exact', head: true }).eq('active', true)
  const { count: harvestCount } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED')
  const { count: pendingSalesCount } = await supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('status', 'Draft')
  
  const { data: stockMovements } = await supabase.from('stock_movements').select('quantity, qty').eq('to_state', 'READY')
  const readyInflow = stockMovements?.reduce((acc: number, curr: { quantity?: number; qty?: number }) => acc + Number(curr.quantity || curr.qty || 0), 0) || 0

  const { data: dispatches } = await supabase.from('dispatches').select('loaded_quantity')
  const dispatchedOutflow = dispatches?.reduce((acc: number, curr: { loaded_quantity?: number }) => acc + Number(curr.loaded_quantity || 0), 0) || 0

  const readyStock = Math.max(0, readyInflow - dispatchedOutflow)

  const { data: bills } = await supabase.from('bills').select('balance_due').gt('balance_due', 0)
  const receivables = bills?.reduce((acc: number, curr: { balance_due?: number }) => acc + Number(curr.balance_due || 0), 0) || 0

  const { data: purchases } = await supabase.from('purchases').select('balance').gt('balance', 0)
  const payables = purchases?.reduce((acc: number, curr: { balance?: number }) => acc + Number(curr.balance || 0), 0) || 0

  // Format today's date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 1. Top Welcome Bar */}
      <div className="flex items-center justify-between pt-1 pb-0.5">
        <div>
          <span className="text-[11px] font-bold text-primary dark:text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Coconut ERP
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations Overview
          </h1>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <Calendar size={12} />
            {today}
          </span>
        </div>
      </div>

      {/* 2. Financial Working Capital Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/dashboard/bills" className="group">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-emerald-50/70 to-white dark:from-emerald-950/25 dark:to-slate-900 shadow-xs group-hover:border-emerald-300 transition-all active:scale-[0.98]">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Receivables
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <ArrowDownLeft size={16} className="stroke-[2.5]" />
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ₹{receivables.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  To collect from buyers
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/purchases" className="group">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-amber-50/70 to-white dark:from-amber-950/25 dark:to-slate-900 shadow-xs group-hover:border-amber-300 transition-all active:scale-[0.98]">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Payables
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <ArrowUpRight size={16} className="stroke-[2.5]" />
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ₹{payables.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  To pay farmers / labor
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 3. Physical Inventory & Farm Assets */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/dashboard/stock" className="group">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group-hover:border-primary/40 transition-all active:scale-[0.98]">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ready Stock
                </span>
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Warehouse size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {readyStock.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">nuts</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  In Godowns
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/farms" className="group">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group-hover:border-primary/40 transition-all active:scale-[0.98]">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Farm Network
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {farmsCount || 0} <span className="text-xs font-normal text-slate-500">farms</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  Active Groves
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 4. Quick Action Launchpad */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-0.5">
          Quick Launchpad
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <Link
            href="/dashboard/purchases/new"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1.5 group-hover:bg-emerald-100 transition-colors">
              <ShoppingCart size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Purchase
            </span>
          </Link>

          <Link
            href="/dashboard/sales/new"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-1.5 group-hover:bg-blue-100 transition-colors">
              <TrendingUp size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Sale Bill
            </span>
          </Link>

          <Link
            href="/dashboard/buyer-payments/new"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-1.5 group-hover:bg-purple-100 transition-colors">
              <CreditCard size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Payment
            </span>
          </Link>

          <Link
            href="/dashboard/farms/new"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-1.5 group-hover:bg-amber-100 transition-colors">
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              New Farm
            </span>
          </Link>
        </div>
      </div>

      {/* 5. Operational Pipeline & Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pipeline & Attention
          </h2>
          <span className="text-[11px] font-semibold text-primary">
            {(harvestCount || 0) + (pendingSalesCount || 0)} Pending
          </span>
        </div>

        <div className="space-y-2">
          <Link href="/dashboard/purchases" className="block group">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group-hover:border-amber-400 active:scale-[0.98] transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-base shrink-0">
                    {harvestCount || 0}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Pending Harvests
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {harvestCount ? `${harvestCount} confirmed cuts ready for transport` : "All farm cuts recorded & processed"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/sales" className="block group">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group-hover:border-blue-400 active:scale-[0.98] transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Pending Deliveries
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pendingSalesCount ? `${pendingSalesCount} orders awaiting dispatch & loading` : "All buyer shipments dispatched"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 6. Facility & Godown Status */}
      <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-primary dark:text-emerald-400 shadow-2xs">
            <Layers size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Main Coconut Godown</p>
            <p className="text-[11px] text-slate-500">Grading, Processing & Dispatch Active</p>
          </div>
        </div>
        <Link 
          href="/dashboard/stock" 
          className="text-[11px] font-bold text-primary dark:text-emerald-400 hover:underline px-2 py-1"
        >
          View Stock
        </Link>
      </div>
    </div>
  )
}
