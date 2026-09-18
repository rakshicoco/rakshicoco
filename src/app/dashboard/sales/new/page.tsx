"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSalesOrder } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = await createClient();
      const { data } = await supabase.from('buyers').select('id, name');
      if (data) setBuyers(data);
    }
    loadData();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      buyer_id: formData.get("buyer_id") as string,
      date: formData.get("date") as string,
      product_type: formData.get("product_type") as string,
      quantity: Number(formData.get("quantity")),
      rate: Number(formData.get("rate")),
      delivery_address: formData.get("delivery_address") as string,
    };

    try {
      await createSalesOrder(data as any);
      router.push("/dashboard/sales");
    } catch (err: any) {
      setError(err.message || "Failed to create sales order. (Insufficient stock?)");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">New Sales Order</h1>
        <p className="text-sm text-slate-500">Record a new sale to a buyer</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Buyer *</label>
          <select required name="buyer_id" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            <option value="">-- Choose Buyer --</option>
            {buyers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Order Date *</label>
          <input required type="date" name="date" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity *</label>
            <input required type="number" inputMode="numeric" name="quantity" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0 units" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate (₹) *</label>
            <input required type="number" step="0.01" inputMode="decimal" name="rate" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Product Type</label>
          <select name="product_type" defaultValue="COCONUT" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            <option value="COCONUT">Raw Coconut</option>
            <option value="DEHUSKED">Dehusked Coconut</option>
            <option value="COPRA">Copra</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery Address</label>
          <textarea name="delivery_address" className="w-full flex min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="If different from default..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700">
          {loading ? "Creating..." : "Confirm Sales Order"}
        </Button>
      </form>
      <div className="h-10" />
    </div>
  );
}
