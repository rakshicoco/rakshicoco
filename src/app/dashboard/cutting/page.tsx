import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, Scissors, ArrowRight, Calendar, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function CuttingPage() {
  const supabase = await createClient()
  
  // Fetch cutting batches joined with teams and purchases
  const { data: batches, error } = await supabase
    .from('cutting_batches')
    .select(`
      *,
      teams:team_id (name),
      purchases:purchase_id (id)
    `)
    .order('date', { ascending: false })

  const hasBatches = Boolean(!error && batches && batches.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cutting Batches</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage harvest and cutting batches from purchases.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/cutting/new">
            <Plus className="mr-2 h-4 w-4" /> New Batch
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search batches..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasBatches ? (
        <EmptyState
          icon={Scissors}
          title="No cutting batches yet"
          description="Create your first cutting batch to begin recording harvesting labor."
          actionHref="/dashboard/cutting/new"
          actionLabel="New Batch"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {batches!.map((batch: any) => (
              <div 
                key={batch.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {batch.id}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Purchase: <Link href={`/dashboard/purchases/${batch.purchase_id}`} className="text-primary font-medium hover:underline">{batch.purchase_id}</Link>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    batch.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {batch.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Team</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {batch.teams?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {batch.date ? new Date(batch.date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Actual Quantity</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {Number(batch.actual_qty || 0).toLocaleString()} nuts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Labour Amount</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ₹{Number(batch.labour_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/cutting/${batch.id}`}>
                    <span>View Batch Details</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Batch ID</th>
                  <th className="px-4 py-3 font-medium">Purchase</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actual Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Labour Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batches!.map((batch: any) => (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link href={`/dashboard/cutting/${batch.id}`}>{batch.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/purchases/${batch.purchase_id}`} className="hover:underline">
                        {batch.purchase_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{batch.teams?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">{batch.date ? new Date(batch.date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(batch.actual_qty).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(batch.labour_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                        batch.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        {batch.status}
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
