"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFarm } from "@/lib/actions/farm";
import { Button } from "@/components/ui/button";

export default function NewFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      owner_name: formData.get("owner_name") as string,
      phone: formData.get("phone") as string,
      village: formData.get("village") as string,
      total_trees: Number(formData.get("total_trees")) || undefined,
      expected_yield: Number(formData.get("expected_yield")) || undefined,
      notes: formData.get("notes") as string,
    };

    try {
      await createFarm(data as any);
      router.push("/dashboard/farms");
    } catch (err: any) {
      setError(err.message || "Failed to create farm");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Add New Farm</h1>
        <p className="text-sm text-slate-500">Enter farm details for the network</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Farm Name *</label>
          <input required name="name" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. South Estate" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Owner Name *</label>
          <input required name="owner_name" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Owner Name" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number *</label>
          <input required type="tel" name="phone" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="10 digit mobile number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Village/Location</label>
          <input name="village" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Village" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Trees</label>
            <input type="number" inputMode="numeric" name="total_trees" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Yield</label>
            <input type="number" inputMode="numeric" name="expected_yield" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0 nuts" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea name="notes" className="w-full flex min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Any special instructions..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Saving..." : "Save Farm"}
        </Button>
      </form>
      <div className="h-10" />
    </div>
  );
}
