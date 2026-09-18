import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Archive, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StockPage() {
  const supabase = await createClient()
  
  // Fetch stock movements
  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100)

  // In a real application, we would aggregate stock by state using SQL Group By.
  // For the MVP UI, we'll calculate simple derived state.
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Godown Stock</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Monitor inventory levels, processing states, and recent movements.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Received / Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-slate-500 mt-1">Units awaiting processing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">In Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">0</div>
            <p className="text-xs text-amber-700 mt-1">Currently assigned to teams</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Ready Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">0</div>
            <p className="text-xs text-green-700 mt-1">Available for sale</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Damaged / Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">0</div>
            <p className="text-xs text-red-700 mt-1">Total loss items</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="w-full mt-8">
        <TabsList>
          <TabsTrigger value="log">Stock Movement Log</TabsTrigger>
          <TabsTrigger value="reserved">Reserved Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input 
                  type="search" 
                  placeholder="Search by reference..." 
                  className="max-w-sm h-9" 
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium text-right">Quantity</th>
                      <th className="px-4 py-3 font-medium">Transition</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {error || !movements || movements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center">
                            <Archive className="h-10 w-10 text-slate-300 mb-2" />
                            <p>No stock movements recorded yet.</p>
                            <p className="text-xs mt-1">Stock movements are generated automatically when shipments are received or processed.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      movements.map((move: any) => (
                        <tr key={move.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{new Date(move.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {move.purchase_id && <span className="text-xs font-mono">PUR: {move.purchase_id}</span>}
                            {move.processing_batch_id && <span className="text-xs font-mono ml-2">PRC: {move.processing_batch_id}</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{Number(move.qty).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 text-xs">
                              {move.from_state && <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{move.from_state}</span>}
                              <span className="text-slate-400">→</span>
                              <span className={`px-2 py-0.5 rounded font-medium ${
                                move.to_state === 'READY' ? 'bg-green-100 text-green-800' :
                                (move.to_state === 'DAMAGED' || move.to_state === 'REJECTED') ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {move.to_state}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{move.reason || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reserved" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <AlertTriangle className="h-10 w-10 text-amber-300 mx-auto mb-2" />
              <p>No stock is currently reserved for sales orders.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
