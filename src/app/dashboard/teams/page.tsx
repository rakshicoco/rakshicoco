import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function TeamsPage() {
  const supabase = await createClient()
  
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      workers:leader_id (name)
    `)
    .order('created_at', { ascending: false })

  const hasTeams = Boolean(!error && teams && teams.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Teams</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage labour groups for cutting, processing, and grouping.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/teams/new">
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Link>
        </Button>
      </div>

      {!hasTeams ? (
        <EmptyState
          icon={Users}
          title="No teams created yet"
          description="Group your workforce into teams for harvesting, cutting, and dehusking operations."
          actionHref="/dashboard/teams/new"
          actionLabel="Create Team"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams!.map((team: any) => (
            <Card key={team.id} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{team.name}</CardTitle>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{team.id}</p>
                </div>
                {!team.active && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">Inactive</span>
                )}
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Leader</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{team.workers?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workload</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{team.workload || 'Standard'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex space-x-2">
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]" asChild>
                    <Link href={`/dashboard/teams/${team.id}`}>Manage Team</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
