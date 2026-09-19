"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/lib/actions/purchase";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Trees, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FarmOption extends SearchableOption {
  total_trees?: number;
  village?: string;
  expected_yield?: number;
  last_harvest_date?: string;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");

  useEffect(() => {
    async function loadFarms() {
      const supabase = createClient();
      const { data } = await supabase
        .from("farms")
        .select("id, name, village, total_trees, expected_yield, last_harvest_date")
        .eq("active", true)
        .order("name", { ascending: true });

      if (data) {
        const formatted: FarmOption[] = data.map((f: any) => ({
          value: f.id,
          label: f.name,
          sublabel: f.village ? `Village: ${f.village}` : undefined,
          badge: `ID: ${f.id}`,
          total_trees: f.total_trees,
          village: f.village,
          expected_yield: f.expected_yield,
          last_harvest_date: f.last_harvest_date,
        }));
        setFarms(formatted);
      }
    }
    loadFarms();
  }, []);

  const selectedFarm = farms.find((f) => f.value === selectedFarmId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const farm_id = formData.get("farm_id") as string;

    if (!farm_id) {
      setError("Please select a farm.");
      setLoading(false);
      return;
    }

    const data = {
      farm_id,
      expected_date: formData.get("expected_date") as string,
      expected_quantity: Number(formData.get("expected_quantity")),
      rate: Number(formData.get("rate")),
      advance_amount: Number(formData.get("advance_amount")) || 0,
      notes: (formData.get("notes") as string) || "",
    };

    try {
      await createPurchase(data as any);
      router.push("/dashboard/purchases");
    } catch (err: any) {
      setError(err.message || "Failed to create purchase");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/purchases"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Schedule Purchase
          </h1>
          <p className="text-xs text-slate-500">Plan a new coconut harvest from a grove</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Searchable Farm Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Farm *
          </label>
          <SearchableSelect
            name="farm_id"
            options={farms}
            value={selectedFarmId}
            onChange={setSelectedFarmId}
            placeholder="Search farm by name or ID..."
            searchPlaceholder="Search by name, village, or ID..."
            required
          />
        </div>

        {/* Selected Farm Information Card */}
        {selectedFarm && (
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs space-y-1 animate-in fade-in duration-150">
            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <MapPin size={14} />
              {selectedFarm.label} — {selectedFarm.village || "No village recorded"}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Trees size={12} className="text-emerald-600" />
                Trees: <strong className="font-mono">{selectedFarm.total_trees || 0}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-emerald-600" />
                Last Harvest: {selectedFarm.last_harvest_date || "None"}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Expected Harvest Date *
          </label>
          <input
            required
            type="date"
            name="expected_date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Expected Qty (Nuts) *
            </label>
            <input
              required
              type="number"
              inputMode="numeric"
              name="expected_quantity"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rate (₹/Nut) *
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
            Advance Given (₹)
          </label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            name="advance_amount"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="0.00"
            defaultValue="0"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notes / Cutting Instructions
          </label>
          <textarea
            name="notes"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Instructions for cutting team..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Scheduling Harvest..." : "Schedule Purchase"}
        </Button>
      </form>
    </div>
  );
}
