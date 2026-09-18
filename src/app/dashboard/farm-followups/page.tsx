import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarClock, Phone, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Farm Follow-ups</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track and manage upcoming harvests based on the 40-day cycle.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Overdue (0)</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Due This Week (0)</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">Upcoming (0)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
              <tbody className="divide-y">
                {error || !followups || followups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CalendarClock className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No active farm follow-ups found.</p>
                        <p className="text-xs mt-1 max-w-md mx-auto">Follow-ups are automatically generated when a farm&apos;s harvest is completed, based on the expected 40-day cycle.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  followups.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
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
