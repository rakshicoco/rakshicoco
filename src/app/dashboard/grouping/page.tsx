import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Route } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function GroupingPage() {
  const supabase = await createClient()
  
  // Fetch grouping batches
  const { data: batches, error } = await supabase
    .from('grouping_batches')
    .select(`
      *,
      teams:team_id (name)
    `)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Grouping Batches</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage grouping and sorting operations before transport or processing.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/grouping/new">
            <Plus className="mr-2 h-4 w-4" /> New Grouping
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by Purchase ID or Cutting Batch..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Batch ID</th>
                  <th className="px-4 py-3 font-medium">Source Ref</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium text-right">Input Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Ready Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Rejected</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !batches || batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Route className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No grouping batches found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((batch: any) => (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/grouping/${batch.id}`}>{batch.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-500">Pur: <Link href={`/dashboard/purchases/${batch.purchase_id}`} className="hover:underline text-primary">{batch.purchase_id}</Link></div>
                        {batch.cutting_batch_id && <div className="text-xs text-slate-500">Cut: <Link href={`/dashboard/cutting/${batch.cutting_batch_id}`} className="hover:underline">{batch.cutting_batch_id}</Link></div>}
                      </td>
                      <td className="px-4 py-3">{batch.teams?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-right">{Number(batch.qty_input).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{Number(batch.ready_qty).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-600">{Number(batch.rejected).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          batch.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {batch.status}
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
