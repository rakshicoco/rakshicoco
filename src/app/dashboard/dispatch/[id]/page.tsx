import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Calendar, User, PackageCheck } from "lucide-react";

export default async function DispatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: dispatch, error } = await supabase
    .from("dispatches")
    .select(`
      *,
      sales_orders:sales_order_id (
        id,
        quantity,
        rate,
        total_amount,
        delivery_address,
        buyers (id, name, phone, address)
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !dispatch) {
    notFound();
  }

  const so = dispatch.sales_orders as any;
  const buyer = so?.buyers;

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/dispatch"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="font-mono">{dispatch.id}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {dispatch.status}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Buyer shipment and dispatch delivery</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Sales Order</span>
            <Link
              href={`/dashboard/sales/${dispatch.sales_order_id}`}
              className="font-mono font-bold text-primary hover:underline"
            >
              {dispatch.sales_order_id}
            </Link>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Buyer</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {buyer?.name || "Direct Customer"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Vehicle</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {dispatch.vehicle_number || "Not assigned"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Driver</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {dispatch.driver_name || "Unassigned"} {dispatch.driver_phone ? `(${dispatch.driver_phone})` : ""}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {dispatch.date ? new Date(dispatch.date).toLocaleDateString() : "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Loaded Quantity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {Number(dispatch.loaded_quantity || 0).toLocaleString()} nuts
            </span>
          </div>
        </div>

        {so?.delivery_address && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Delivery Address:</span>
            <p className="text-slate-500">{so.delivery_address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
