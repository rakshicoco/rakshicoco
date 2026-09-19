import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Archive, AlertTriangle, ArrowRight, Clock, Box } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function StockPage() {
  const supabase = await createClient()
  
  // Fetch stock movements
  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const hasMovements = Boolean(!error && movements && movements.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Godown Stock</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor inventory levels, processing states, and recent movements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Received</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">0</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">In Processing</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-300">0</div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Assigned to teams</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ready Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-300">0</div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Ready for dispatch</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/60 dark:bg-red-950/30 border-red-200/70 dark:border-red-900/40">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">Damaged/Loss</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-300">0</div>
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1">Rejected coconuts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="w-full mt-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex min-h-[44px]">
          <TabsTrigger value="log" className="min-h-[38px] text-sm">Stock Movement Log</TabsTrigger>
          <TabsTrigger value="reserved" className="min-h-[38px] text-sm">Reserved Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="log" className="mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="search" 
                placeholder="Search movements..." 
                className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
              />
            </div>
          </div>

          {!hasMovements ? (
            <EmptyState
              icon={Archive}
              title="No stock movements recorded yet"
              description="Stock movements are logged automatically when coconuts are received, dehusked, graded, or dispatched."
            />
          ) : (
            <>
              {/* Mobile Stacked Cards (<768px) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {movements!.map((move: any) => (
                  <div 
                    key={move.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(move.timestamp || move.created_at).toLocaleString()}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {Number(move.qty).toLocaleString()} nuts
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs">
                        {move.from_state && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium">
                            {move.from_state}
                          </span>
                        )}
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          move.to_state === 'READY' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                          (move.to_state === 'DAMAGED' || move.to_state === 'REJECTED') ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {move.to_state}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {move.purchase_id ? `PUR: ${move.purchase_id}` : move.processing_batch_id ? `PRC: ${move.processing_batch_id}` : ''}
                      </span>
                    </div>

                    {move.reason && (
                      <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        {move.reason}
                      </p>
                    )}
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
                            <th className="px-4 py-3 font-medium">Timestamp</th>
                            <th className="px-4 py-3 font-medium">Reference</th>
                            <th className="px-4 py-3 font-medium text-right">Quantity</th>
                            <th className="px-4 py-3 font-medium">Transition</th>
                            <th className="px-4 py-3 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {movements!.map((move: any) => (
                            <tr key={move.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-slate-600">{new Date(move.timestamp || move.created_at).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                {move.purchase_id && <span className="text-xs font-mono">PUR: {move.purchase_id}</span>}
                                {move.processing_batch_id && <span className="text-xs font-mono ml-2">PRC: {move.processing_batch_id}</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">{Number(move.qty).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2 text-xs">
                                  {move.from_state && <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{move.from_state}</span>}
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="reserved" className="mt-4">
          <EmptyState
            icon={Box}
            title="No reserved stock"
            description="No coconuts are currently reserved for pending sales orders or deliveries."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
