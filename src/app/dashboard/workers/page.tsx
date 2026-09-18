import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, UserSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function WorkersPage() {
  const supabase = await createClient()
  
  const { data: workers, error } = await supabase
    .from('workers')
    .select(`
      *,
      teams:team_id (name)
    `)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Workers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage individual labour profiles and assignments.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Worker
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search workers by name or phone..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
              <tbody className="divide-y">
                {error || !workers || workers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <UserSquare className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No workers found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  workers.map((worker: any) => (
                    <tr key={worker.id} className="hover:bg-slate-50">
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
