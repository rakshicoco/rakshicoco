import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CalendarClock, Phone, MessageSquare, ArrowRight, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function FarmFollowupsPage() {
  const supabase = await createClient()
  
  // Fetch follow-ups joined with farms
  const { data: followups, error } = await supabase
    .from('farm_followups')
    .select(`
      *,
      farms:farm_id (
        id,
        owner_name,
        phone,
        village,
        actual_harvest_date,
        expected_next_harvest_date
      )
    `)
    .order('next_followup', { ascending: true })
    .limit(50)

  const hasFollowups = Boolean(!error && followups && followups.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Farm Follow-ups</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage upcoming harvests based on the 40-day cycle.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 rounded-full text-xs font-medium">Overdue</span>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full text-xs font-medium">Due This Week</span>
        <span className="px-3 py-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-full text-xs font-medium">Upcoming</span>
      </div>

      {!hasFollowups ? (
        <EmptyState
          icon={CalendarClock}
          title="No farm follow-ups due"
          description="Follow-ups are automatically scheduled 40 days after each farm's completed harvest."
          actionHref="/dashboard/farms"
          actionLabel="View Farm Network"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {followups!.map((item: any) => (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                      {item.farms?.owner_name || 'Direct Farm'}
                    </h3>
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {item.farms?.id} • {item.farms?.village || 'Unknown village'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    item.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                    item.status === 'DUE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                    item.status === 'NEGOTIATING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Last Harvest</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.farms?.actual_harvest_date ? new Date(item.farms.actual_harvest_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Expected Next</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {item.farms?.expected_next_harvest_date ? new Date(item.farms.expected_next_harvest_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  {item.farms?.phone && (
                    <Button variant="outline" size="sm" asChild className="flex-1 min-h-[44px]">
                      <a href={`tel:${item.farms.phone}`}><Phone className="h-4 w-4 mr-1 text-emerald-600" /> Call Farmer</a>
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" className="flex-1 min-h-[44px]">
                    <MessageSquare className="h-4 w-4 mr-1 text-slate-600" /> Log Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Farm</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Last Harvest</th>
                  <th className="px-4 py-3 font-medium">Expected Next</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Contact</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {followups!.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link href={`/dashboard/farms/${item.farms?.id}`}>{item.farms?.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.farms?.owner_name}</div>
                      <div className="text-xs text-slate-500">{item.farms?.village}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.farms?.actual_harvest_date ? new Date(item.farms.actual_harvest_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.farms?.expected_next_harvest_date ? new Date(item.farms.expected_next_harvest_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        item.status === 'DUE' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'NEGOTIATING' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.last_contact ? new Date(item.last_contact).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {item.farms?.phone && (
                        <Button variant="outline" size="sm" asChild className="h-8 px-2 text-slate-600">
                          <a href={`tel:${item.farms.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" className="h-8 px-2 text-slate-700">
                        <MessageSquare className="h-3 w-3 mr-1" /> Log
                      </Button>
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
