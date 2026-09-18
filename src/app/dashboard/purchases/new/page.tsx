"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/lib/actions/purchase";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    async function loadFarms() {
      const supabase = await createClient();
      const { data } = await supabase.from('farms').select('id, name, village').eq('active', true);
      if (data) setFarms(data);
    }
    loadFarms();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      farm_id: formData.get("farm_id") as string,
      expected_date: formData.get("expected_date") as string,
      expected_quantity: Number(formData.get("expected_quantity")),
      rate: Number(formData.get("rate")),
      advance_amount: Number(formData.get("advance_amount")) || 0,
      notes: formData.get("notes") as string,
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
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Schedule Purchase</h1>
        <p className="text-sm text-slate-500">Plan a new coconut harvest</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Farm *</label>
          <select required name="farm_id" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            <option value="">-- Choose Farm --</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name} {f.village ? `(${f.village})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Expected Harvest Date *</label>
          <input required type="date" name="expected_date" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Qty (Nuts) *</label>
            <input required type="number" inputMode="numeric" name="expected_quantity" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate (₹/Nut) *</label>
            <input required type="number" step="0.01" inputMode="decimal" name="rate" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0.00" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Advance Given (₹)</label>
          <input type="number" step="0.01" inputMode="decimal" name="advance_amount" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0.00" defaultValue="0" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea name="notes" className="w-full flex min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Instructions for cutting team..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Scheduling..." : "Schedule Purchase"}
        </Button>
      </form>
      <div className="h-10" />
    </div>
  );
}
