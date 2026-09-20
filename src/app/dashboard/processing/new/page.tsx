"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProcessingBatch } from "@/lib/actions/processing";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { getPurchasesForSelect, getTeamsForSelect } from "@/lib/actions/select_options";
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";

export default function NewProcessingBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<SearchableOption[]>([]);
  const [teams, setTeams] = useState<SearchableOption[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [purData, teamData] = await Promise.all([
        getPurchasesForSelect(),
        getTeamsForSelect()
      ]);

      if (active) {
        setPurchases(purData);
        setTeams(teamData);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      purchase_id: selectedPurchaseId || undefined,
      team_id: selectedTeamId || undefined,
      qty_given: Number(formData.get("qty_given")),
      rate: Number(formData.get("rate")),
      date: formData.get("date") as string,
      notes: (formData.get("notes") as string) || "",
    };

    try {
      const batch = await createProcessingBatch(data);
      router.push(`/dashboard/processing/${batch.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create processing batch");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/processing"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Processing Batch
          </h1>
          <p className="text-xs text-slate-500">Dehusking and coconut copra grading</p>
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
            Source Purchase Order (Optional)
          </label>
          <SearchableSelect
            name="purchase_id"
            options={purchases}
            value={selectedPurchaseId}
            onChange={setSelectedPurchaseId}
            placeholder="Select purchase batch..."
            searchPlaceholder="Search PO or farm..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Processing Team
          </label>
          <SearchableSelect
            name="team_id"
            options={teams}
            value={selectedTeamId}
            onChange={setSelectedTeamId}
            placeholder="Assign dehusking team..."
            searchPlaceholder="Search team name..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Processing Date *
          </label>
          <input
            required
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Quantity Given *
            </label>
            <input
              required
              type="number"
              inputMode="numeric"
              name="qty_given"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Dehusking Rate (₹) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              inputMode="decimal"
              name="rate"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Batch notes..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Starting Processing..." : "Create Processing Batch"}
        </Button>
      </form>
    </div>
  );
}
