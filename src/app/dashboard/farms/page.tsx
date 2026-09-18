import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Map, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function FarmsPage() {
  const supabase = await createClient()
  
  // Fetch farms
  const { data: farms, error } = await supabase
    .from('farms')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Farms</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your permanent farm entities and locations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/farms/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Farm
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search farms by ID, owner, or village..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
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
                {error || !farms || farms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Map className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No farms found in the system.</p>
                        <Button variant="link" asChild className="mt-2">
                          <Link href="/dashboard/farms/new">Create the first farm</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  farms.map((farm: any) => (
                    <tr key={farm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/farms/${farm.id}`}>{farm.id}</Link>
                      </td>
                      <td className="px-4 py-3">{farm.owner_name}</td>
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
