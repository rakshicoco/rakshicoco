import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Building2, ArrowRight, Phone, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function BuyersPage() {
  const supabase = await createClient()
  
  // Fetch buyers
  const { data: buyers, error } = await supabase
    .from('buyers')
    .select('*')
    .order('created_at', { ascending: false })

  const hasBuyers = Boolean(!error && buyers && buyers.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Buyers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customer directory, commercial terms, and order history.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/buyers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Buyer
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search by name, company, or city..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
      </div>

      {!hasBuyers ? (
        <EmptyState
          icon={Building2}
          title="No buyers yet"
          description="Register buyers and wholesale partners to create sales orders and generate bills."
          actionHref="/dashboard/buyers/new"
          actionLabel="Add Buyer"
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {buyers!.map((buyer: any) => (
              <div 
                key={buyer.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                      {buyer.name}
                    </h3>
                    <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {buyer.id}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    buyer.active ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {buyer.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Company</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {buyer.company || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Location</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {buyer.city ? `${buyer.city}${buyer.state ? `, ${buyer.state}` : ''}` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <a href={`tel:${buyer.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      {buyer.phone || '-'}
                    </a>
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full min-h-[44px] justify-between text-sm font-medium border-slate-200 dark:border-slate-800 mt-1">
                  <Link href={`/dashboard/buyers/${buyer.id}`}>
                    <span>View Buyer Profile</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
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
                      {buyers!.map((buyer: any) => (
                        <tr key={buyer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-500 font-mono text-xs">{buyer.id}</td>
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
