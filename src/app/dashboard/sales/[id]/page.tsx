import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Calendar, Building2, PackageCheck, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmSalesOrder } from "@/lib/actions/sales";

export default async function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("sales_orders")
    .select(`
      *,
      buyers (id, name, contact_person, phone, address, gstin),
      dispatches (id, vehicle_number, driver_name, loaded_quantity, status, date)
    `)
    .eq("id", params.id)
    .single();

  if (error || !order) {
    notFound();
  }

  const buyer = order.buyers as any;
  const dispatches = (order.dispatches as any[]) || [];
  const isDraft = order.status === "Draft" || order.status === "DRAFT";

  async function handleConfirm() {
    "use server";
    await confirmSalesOrder(params.id);
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/sales"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="font-mono">{order.id}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              order.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
              order.status === "DISPATCHED" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
              "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {order.status}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Sales order & fulfillment tracking</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Buyer</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {buyer?.name || "Direct Customer"}
            </span>
            {buyer?.phone && (
              <p className="text-[11px] text-slate-500">{buyer.phone}</p>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Order Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {order.date ? new Date(order.date).toLocaleDateString() : "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Quantity</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {Number(order.quantity || 0).toLocaleString()} nuts
            </span>
            <span className="text-[10px] text-slate-400 block">
              {order.product_type || "COCONUT"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Rate & Total</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{Number(order.total_amount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">
              @ ₹{Number(order.rate || 0).toFixed(2)}/nut
            </span>
          </div>
        </div>

        {order.delivery_address && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Delivery Address:</span>
            <p className="text-slate-500">{order.delivery_address}</p>
          </div>
        )}

        {isDraft && (
          <form action={handleConfirm} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" className="w-full min-h-[44px] font-bold bg-green-600 hover:bg-green-700">
              <CheckCircle2 size={16} className="mr-1.5" />
              Confirm Sales Order
            </Button>
          </form>
        )}
      </div>

      {/* Linked Dispatches */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Shipments & Dispatches ({dispatches.length})
          </h3>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href="/dashboard/dispatch/new">
              <Send size={12} className="mr-1" /> New Dispatch
            </Link>
          </Button>
        </div>

        {dispatches.length === 0 ? (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No dispatches recorded yet for this sales order.
          </div>
        ) : (
          dispatches.map((d: any) => (
            <Link key={d.id} href={`/dashboard/dispatch/${d.id}`} className="block">
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-primary/50 transition-all">
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{d.id}</div>
                  <div className="text-slate-500 mt-0.5">{d.vehicle_number || "No vehicle"} • {Number(d.loaded_quantity || 0).toLocaleString()} nuts</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {d.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
