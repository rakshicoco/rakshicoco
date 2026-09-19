"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCuttingBatch } from "@/lib/actions/processing";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Scissors } from "lucide-react";
import Link from "next/link";

export default function NewCuttingBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<SearchableOption[]>([]);
  const [teams, setTeams] = useState<SearchableOption[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Load purchases
      const { data: purData } = await supabase
        .from("purchases")
        .select("id, farm_id, expected_quantity, farms(name)")
        .order("created_at", { ascending: false });

      if (purData) {
        setPurchases(
          purData.map((p: any) => ({
            value: p.id,
            label: `${p.id} — ${(p.farms as any)?.name || "Farm"}`,
            sublabel: `Expected: ${Number(p.expected_quantity || 0).toLocaleString()} nuts`,
            badge: "PO",
          }))
        );
      }

      // Load teams
      const { data: teamData } = await supabase
        .from("teams")
        .select("id, name")
        .eq("active", true)
        .order("name");

      if (teamData) {
        setTeams(
          teamData.map((t: any) => ({
            value: t.id,
            label: t.name,
            badge: "TEAM",
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
    const purchase_id = formData.get("purchase_id") as string;
    const team_id = formData.get("team_id") as string;

    if (!purchase_id || !team_id) {
      setError("Please select both a purchase order and a cutting team.");
      setLoading(false);
      return;
    }

    const data = {
      purchase_id,
      team_id,
      date: formData.get("date") as string,
      expected_output_nuts: Number(formData.get("expected_output_nuts")),
      rate_per_nut: Number(formData.get("rate_per_nut")),
    };

    try {
      const batch = await createCuttingBatch(data);
      router.push(`/dashboard/cutting/${batch.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create cutting batch");
      setLoading(false);
    }
  }

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Cutting Batch
          </h1>
          <p className="text-xs text-slate-500">Record coconut harvest & tree-cutting operation</p>
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
            Select Purchase Order *
          </label>
          <SearchableSelect
            name="purchase_id"
            options={purchases}
            value={selectedPurchaseId}
            onChange={setSelectedPurchaseId}
            placeholder="Search purchase order..."
            searchPlaceholder="Search PO or farm..."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Assign Harvester Team *
          </label>
          <SearchableSelect
            name="team_id"
            options={teams}
            value={selectedTeamId}
            onChange={setSelectedTeamId}
            placeholder="Select cutting team..."
            searchPlaceholder="Search team name..."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Cutting Date *
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
              Expected Output (Nuts) *
            </label>
            <input
              required
              type="number"
              inputMode="numeric"
              name="expected_output_nuts"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rate per Nut (₹) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              inputMode="decimal"
              name="rate_per_nut"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0.00"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Starting Batch..." : "Create Cutting Batch"}
        </Button>
      </form>
    </div>
  );
}
