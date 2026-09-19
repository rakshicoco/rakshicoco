"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroupingBatch } from "@/lib/actions/processing";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Route } from "lucide-react";
import Link from "next/link";

export default function NewGroupingBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuttingBatches, setCuttingBatches] = useState<SearchableOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("cutting_batches")
        .select("id, actual_output_nuts, expected_output_nuts, date, purchase_id")
        .order("created_at", { ascending: false });

      if (data) {
        setCuttingBatches(
          data.map((b: any) => ({
            value: b.id,
            label: `${b.id} — PO: ${b.purchase_id || "Direct"}`,
            sublabel: `Harvested: ${Number(b.actual_output_nuts || b.expected_output_nuts || 0).toLocaleString()} nuts`,
            badge: "CUTTING",
          }))
        );
      }
    }
    loadData();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const cutting_batch_id = formData.get("cutting_batch_id") as string;

    if (!cutting_batch_id) {
      setError("Please select a cutting batch to group.");
      setLoading(false);
      return;
    }

    const data = {
      cutting_batch_ids: [cutting_batch_id],
      date: formData.get("date") as string,
      destination_godown: (formData.get("destination_godown") as string) || "Main Coconut Godown",
    };

    try {
      const group = await createGroupingBatch(data);
      router.push(`/dashboard/grouping/${group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create grouping batch");
      setLoading(false);
    }
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Grouping Batch
          </h1>
          <p className="text-xs text-slate-500">Group, grade & sort harvested coconut lots</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Cutting Batch *
          </label>
          <SearchableSelect
            name="cutting_batch_id"
            options={cuttingBatches}
            value={selectedBatchId}
            onChange={setSelectedBatchId}
            placeholder="Search cutting batch..."
            searchPlaceholder="Search by batch ID..."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Grouping Date *
          </label>
          <input
            required
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Destination Facility / Godown
          </label>
          <input
            type="text"
            name="destination_godown"
            defaultValue="Main Coconut Godown"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Creating Group..." : "Create Grouping Batch"}
        </Button>
      </form>
    </div>
  );
}
