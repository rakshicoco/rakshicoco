import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Map, Plus, Phone, Calendar, ArrowRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSearchInput } from '@/components/ui/ListSearchInput'

export default async function FarmsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const supabase = await createClient()
  const q = searchParams?.q?.trim()
  
  // Fetch farms with explicit column selection and page limit
  let query = supabase
    .from('farms')
    .select('id, name, owner_name, village, phone, expected_next_harvest, active, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  if (q) {
    query = query.or(`name.ilike.%${q}%,owner_name.ilike.%${q}%,village.ilike.%${q}%,id.ilike.%${q}%`)
  }

  const { data: farms, error } = await query

  const hasFarms = Boolean(!error && farms && farms.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Farms</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your permanent farm network and harvest cycles.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/farms/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Farm
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <ListSearchInput placeholder="Search farms by ID, owner, or village..." />
      </div>

      {!hasFarms ? (
        <EmptyState
          icon={Map}
          title="No farms yet"
          description="Create your first farm to start tracking procurement and coconut harvests."
          actionHref="/dashboard/farms/new"
          actionLabel="Add New Farm"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {farms!.map((farm: any) => (
              <div 
                key={farm.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">
                      {farm.name || farm.owner_name}
                    </h3>
                    <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {farm.id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {farm.active ? 'Active' : 'Archived'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Owner</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{farm.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Village</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{farm.village || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <a href={`tel:${farm.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      {farm.phone || '-'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Next Harvest</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {farm.expected_next_harvest_date ? new Date(farm.expected_next_harvest_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/farms/${farm.id}`}>
                    <span>View Farm Details</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Data Table (>=768px) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Farm ID</th>
                        <th className="px-4 py-3 font-medium">Owner</th>
                        <th className="px-4 py-3 font-medium">Village / Location</th>
                        <th className="px-4 py-3 font-medium">Phone</th>
                        <th className="px-4 py-3 font-medium">Last Harvest</th>
                        <th className="px-4 py-3 font-medium">Next Expected</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {farms!.map((farm: any) => (
                        <tr key={farm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary font-mono text-xs">
                            <Link href={`/dashboard/farms/${farm.id}`}>{farm.id}</Link>
                          </td>
                          <td className="px-4 py-3 font-medium">{farm.owner_name}</td>
                          <td className="px-4 py-3">
                            {farm.village}
                            {farm.location && <span className="text-slate-500 text-xs block">{farm.location}</span>}
                          </td>
                          <td className="px-4 py-3">{farm.phone}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {farm.actual_harvest_date ? new Date(farm.actual_harvest_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {farm.expected_next_harvest_date ? new Date(farm.expected_next_harvest_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/farms/${farm.id}`}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
