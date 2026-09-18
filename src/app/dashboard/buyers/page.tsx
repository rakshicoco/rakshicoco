import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function BuyersPage() {
  const supabase = await createClient()
  
  // Fetch buyers
  const { data: buyers, error } = await supabase
    .from('buyers')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Buyers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your customer database and sales history.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/buyers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Buyer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search by name, company, or city..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !buyers || buyers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No buyers found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  buyers.map((buyer: any) => (
                    <tr key={buyer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-500">{buyer.id}</td>
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/buyers/${buyer.id}`}>{buyer.name}</Link>
                      </td>
                      <td className="px-4 py-3">{buyer.company || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{buyer.city || '-'}</div>
                        <div className="text-xs text-slate-500">{buyer.state || ''}</div>
                      </td>
                      <td className="px-4 py-3">{buyer.phone || '-'}</td>
                      <td className="px-4 py-3">
                        {buyer.active ? (
                          <span className="text-green-600 font-medium text-xs">Active</span>
                        ) : (
                          <span className="text-red-600 font-medium text-xs">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/buyers/${buyer.id}`}>View</Link>
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
