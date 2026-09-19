import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scissors, Calendar, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeCuttingBatch } from "@/lib/actions/processing";

export default async function CuttingBatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: batch, error } = await supabase
    .from("cutting_batches")
    .select(`
      *,
      teams:team_id (id, name),
      purchases:purchase_id (id, farm_id, farms(name, village))
    `)
    .eq("id", params.id)
    .single();

  if (error || !batch) {
    notFound();
  }

  async function handleComplete(formData: FormData) {
    "use server";
    const actual_output_nuts = Number(formData.get("actual_output_nuts"));
    const rejection_count = Number(formData.get("rejection_count") || 0);

    await completeCuttingBatch(params.id, {
      actual_output_nuts,
      rejection_count,
    });
  }

  const isCompleted = batch.status === "COMPLETED";

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/cutting"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="font-mono">{batch.id}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isCompleted ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}>
              {batch.status}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Harvest and tree-cutting batch record</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Purchase Order</span>
            <Link
              href={`/dashboard/purchases/${batch.purchase_id}`}
              className="font-mono font-bold text-primary hover:underline"
            >
              {batch.purchase_id}
            </Link>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {(batch.purchases?.farms as any)?.name || "Farm"}
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Cutting Team</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Users size={12} className="text-slate-400" />
              {batch.teams?.name || "Unassigned"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {batch.date ? new Date(batch.date).toLocaleDateString() : "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Rate / Nut</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ₹{Number(batch.rate_per_nut || 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Expected Output</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {Number(batch.expected_output_nuts || 0).toLocaleString()} nuts
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Actual Harvested</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {Number(batch.actual_output_nuts || 0).toLocaleString()} nuts
            </span>
          </div>
        </div>

        {batch.rejection_count > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs text-rose-800 dark:text-rose-300">
            Rejection / Damaged: <strong>{batch.rejection_count} nuts</strong>
          </div>
        )}

        {/* Complete Batch Action if In Progress */}
        {!isCompleted && (
          <form action={handleComplete} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Finalize Cutting Batch
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Actual Harvest (Nuts)</label>
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  name="actual_output_nuts"
                  defaultValue={batch.expected_output_nuts}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Rejections (Nuts)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="rejection_count"
                  defaultValue={0}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
            <Button type="submit" className="w-full min-h-[44px] font-bold bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 size={16} className="mr-1.5" />
              Complete Batch
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
