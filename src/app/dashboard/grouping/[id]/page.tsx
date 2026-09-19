import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Route, Calendar, PackageCheck } from "lucide-react";

export default async function GroupingBatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: batch, error } = await supabase
    .from("grouping_batches")
    .select(`
      *,
      teams:team_id (name)
    `)
    .eq("id", params.id)
    .single();

  if (error || !batch) {
    notFound();
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/grouping"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="font-mono">{batch.id}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {batch.status}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Grading and sorting batch details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {batch.date ? new Date(batch.date).toLocaleDateString() : "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Destination</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {batch.destination_godown || "Main Godown"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Ready Quantity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {Number(batch.ready_qty || 0).toLocaleString()} nuts
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Rejected Quantity</span>
            <span className="font-bold text-red-600 dark:text-red-400 text-sm">
              {Number(batch.rejected || 0).toLocaleString()} nuts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
