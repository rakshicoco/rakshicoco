"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    async function loadPurchase() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("purchases")
        .select("*, farms(name)")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Purchase order not found");
      } else {
        setPurchase(data);
      }
      setFetching(false);
    }
    loadPurchase();
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const expected_quantity = Number(formData.get("expected_quantity"));
    const rate = Number(formData.get("rate"));
    const expected_date = formData.get("expected_date") as string;
    const notes = (formData.get("notes") as string) || "";

    try {
      const { error: updateErr } = await supabase
        .from("purchases")
        .update({
          expected_quantity,
          rate,
          expected_date,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (updateErr) throw new Error(updateErr.message);

      router.push(`/dashboard/purchases/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update purchase order");
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading purchase details...</div>;
  }

  if (!purchase) {
    return <div className="p-8 text-center text-xs text-rose-500">Purchase order could not be loaded.</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href={`/dashboard/purchases/${params.id}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Edit Purchase</span>
            <span className="font-mono text-primary text-base">({purchase.id})</span>
          </h1>
          <p className="text-xs text-slate-500">Farm: {purchase.farms?.name || "Grove"}</p>
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
            Expected Harvest Date *
          </label>
          <input
            required
            type="date"
            name="expected_date"
            defaultValue={purchase.expected_date || ""}
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
              defaultValue={purchase.expected_quantity || ""}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
              defaultValue={purchase.rate || ""}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
            defaultValue={purchase.notes || ""}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Saving..." : "Save Purchase Changes"}
        </Button>
      </form>
    </div>
  );
}
