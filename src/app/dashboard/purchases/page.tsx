import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function PurchasesPage() {
  const supabase = await createClient()
  
  // Fetch purchases joined with farms
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      farms:farm_id (
        owner_name,
        village
      )
    `)
    .order('purchase_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Purchases</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage transactions from farms, quantities, and status.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchases/new">
            <Plus className="mr-2 h-4 w-4" /> New Purchase
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search purchases by ID or Farm..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Purchase ID</th>
                  <th className="px-4 py-3 font-medium">Farm</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !purchases || purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No purchases found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur: any) => (
                    <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/purchases/${pur.id}`}>{pur.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{pur.farms?.owner_name}</div>
                        <div className="text-xs text-slate-500">{pur.farm_id}</div>
                      </td>
                      <td className="px-4 py-3">{new Date(pur.purchase_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {Number(pur.actual_qty || pur.expected_qty).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">₹{Number(pur.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 font-medium">
                        ₹{Number(pur.gross_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          pur.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          pur.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          pur.status === 'HARVESTING' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {pur.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/purchases/${pur.id}`}>View</Link>
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
