"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTransportTrip } from "@/lib/actions/transport";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function NewTransportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sourceType, setSourceType] = useState("FARM");
  const [destinationType, setDestinationType] = useState("GODOWN");
  
  const [sources, setSources] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);

  useEffect(() => {
    async function loadEntities() {
      const supabase = await createClient();
      
      const sourceQuery = sourceType === "FARM"
        ? supabase.from('farms').select('id, name')
        : supabase.from('godowns').select('id, name');

      const destQuery = destinationType === "GODOWN"
        ? supabase.from('godowns').select('id, name')
        : supabase.from('buyers').select('id, name');

      const [{ data: srcData }, { data: dstData }] = await Promise.all([sourceQuery, destQuery]);
      setSources(srcData || []);
      setDestinations(dstData || []);
    }
    loadEntities();
  }, [sourceType, destinationType]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      source_type: sourceType,
      source_id: formData.get("source_id") as string,
      destination_type: destinationType,
      destination_id: formData.get("destination_id") as string,
      vehicle_number: formData.get("vehicle_number") as string,
      driver_name: formData.get("driver_name") as string,
      driver_phone: formData.get("driver_phone") as string,
      expected_quantity: Number(formData.get("expected_quantity")),
      freight_amount: Number(formData.get("freight_amount")) || 0,
      date: formData.get("date") as string,
    };

    try {
      await createTransportTrip(data as any);
      router.push("/dashboard/transport");
    } catch (err: any) {
      setError(err.message || "Failed to create transport trip");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Schedule Transport</h1>
        <p className="text-sm text-slate-500">Record vehicle dispatch details</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date *</label>
          <input required type="date" name="date" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Type</label>
            <select value={sourceType} onChange={e => setSourceType(e.target.value)} className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="FARM">Farm</option>
              <option value="GODOWN">Godown</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Source *</label>
            <select required name="source_id" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="">-- Choose --</option>
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">To Type</label>
            <select value={destinationType} onChange={e => setDestinationType(e.target.value)} className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="GODOWN">Godown</option>
              <option value="BUYER">Buyer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Destination *</label>
            <select required name="destination_id" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="">-- Choose --</option>
              {destinations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle Number *</label>
          <input required name="vehicle_number" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm uppercase" placeholder="e.g. TN 01 AA 1234" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity Loaded *</label>
            <input required type="number" inputMode="numeric" name="expected_quantity" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Freight Rate/Amount</label>
            <input type="number" step="0.01" inputMode="decimal" name="freight_amount" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0.00" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600">
          {loading ? "Saving..." : "Start Trip"}
        </Button>
      </form>
      <div className="h-10" />
    </div>
  );
}
