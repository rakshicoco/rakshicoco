import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function SalesPage() {
  const supabase = await createClient()
  
  // Fetch sales orders
  const { data: sales, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      buyers:buyer_id (name, company)
    `)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sales Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage outgoing orders and stock reservations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <Plus className="mr-2 h-4 w-4" /> New Sales Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search sales orders by ID or buyer..." 
              className="max-w-sm h-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                  <th className="px-4 py-3 font-medium">Order Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {error || !sales || sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No sales orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/dashboard/sales/${order.id}`}>{order.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.buyers?.name}</div>
                        <div className="text-xs text-slate-500">{order.buyers?.company || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{order.date ? new Date(order.date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium">{Number(order.qty).toLocaleString()}</div>
                        {order.dispatched_qty > 0 && <div className="text-xs text-slate-500">{Number(order.dispatched_qty).toLocaleString()} disp.</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₹{Number(order.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          (order.status === 'DISPATCHED' || order.status === 'PARTIALLY_DISPATCHED') ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          order.payment_status === 'PAID' ? 'text-green-600 bg-green-50' :
                          order.payment_status === 'PARTIAL' ? 'text-amber-600 bg-amber-50' :
                          'text-slate-600 bg-slate-100'
                        }`}>
                          {order.payment_status}
                        </span>
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
