import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'

export default async function TeamsPage() {
  const supabase = await createClient()
  
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      workers:leader_id (name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Teams</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage labour groups for cutting, processing, and grouping.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teams/new">
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {error || !teams || teams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-lg border">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p>No teams created yet.</p>
          </div>
        ) : (
          teams.map((team: any) => (
            <Card key={team.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-bold">{team.name}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{team.id}</p>
                </div>
                {!team.active && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">Inactive</span>
                )}
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Leader</span>
                    <span className="font-medium">{team.workers?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workload</span>
                    <span className="font-medium">{team.workload || 'Unknown'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/teams/${team.id}`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
