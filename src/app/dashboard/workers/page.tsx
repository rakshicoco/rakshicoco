import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, UserSquare, ArrowRight, Phone, Briefcase, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function WorkersPage() {
  const supabase = await createClient()
  
  const { data: workers, error } = await supabase
    .from('workers')
    .select(`
      *,
      teams:team_id (name)
    `)
    .order('name', { ascending: true })

  const hasWorkers = Boolean(!error && workers && workers.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Workers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage individual labour profiles and assignments.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/workers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Worker
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search workers by name or phone..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasWorkers ? (
        <EmptyState
          icon={UserSquare}
          title="No workers registered"
          description="Register your first worker or driver to manage labour operations and payroll."
          actionHref="/dashboard/workers/new"
          actionLabel="Add Worker"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {workers!.map((worker: any) => (
              <div 
                key={worker.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                      {worker.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {worker.id}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    worker.active ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {worker.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Role</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {worker.role || 'Worker'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Team</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {worker.teams?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {worker.phone || '-'}
                    </span>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/workers/${worker.id}`}>
                    <span>View Profile</span>
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
                  <th className="px-4 py-3 font-medium">Worker ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workers!.map((worker: any) => (
                  <tr key={worker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-500">{worker.id}</td>
                    <td className="px-4 py-3 font-medium text-primary">{worker.name}</td>
                    <td className="px-4 py-3">{worker.phone || '-'}</td>
                    <td className="px-4 py-3">{worker.role || '-'}</td>
                    <td className="px-4 py-3">{worker.teams?.name || '-'}</td>
                    <td className="px-4 py-3">
                      {worker.active ? (
                        <span className="text-green-600 font-medium text-xs">Active</span>
                      ) : (
                        <span className="text-red-600 font-medium text-xs">Inactive</span>
                      )}
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
