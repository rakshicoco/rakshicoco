import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Warehouse, Calendar, ArrowRight } from "lucide-react";

export default async function StockMovementDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: movement, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !movement) {
    notFound();
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/stock"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Stock Entry</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {movement.to_state}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Inventory movement ledger record</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block mb-0.5">Product</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {movement.product_type || "COCONUT"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Quantity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {Number(movement.qty || 0).toLocaleString()} nuts
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Transition</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>{movement.from_state || "INIT"}</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="font-bold text-primary">{movement.to_state}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Date & Time</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {movement.created_at ? new Date(movement.created_at).toLocaleString() : "-"}
            </span>
          </div>

          {movement.reference_type && (
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Source Reference</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {movement.reference_type}: {movement.reference_id || "-"}
              </span>
            </div>
          )}

          {movement.notes && (
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Notes</span>
              <p className="text-slate-600 dark:text-slate-400">{movement.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
