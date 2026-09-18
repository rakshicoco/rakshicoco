"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBuyer } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";

export default function NewBuyerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contact_person: formData.get("contact_person") as string,
      phone: formData.get("phone") as string,
      gstin: formData.get("gstin") as string,
      address: formData.get("address") as string,
    };

    try {
      await createBuyer(data as any);
      router.push("/dashboard/buyers");
    } catch (err: any) {
      setError(err.message || "Failed to create buyer");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Add New Buyer</h1>
        <p className="text-sm text-slate-500">Register a new wholesale buyer</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Company/Buyer Name *</label>
          <input required name="name" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Acme Coco Traders" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Contact Person</label>
          <input name="contact_person" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Contact Name" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number *</label>
          <input required type="tel" name="phone" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="10 digit mobile number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">GSTIN</label>
          <input name="gstin" className="w-full flex h-11 min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm uppercase" placeholder="GST Number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <textarea name="address" className="w-full flex min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Billing/Delivery Address" />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Saving..." : "Save Buyer"}
        </Button>
      </form>
      <div className="h-10" />
    </div>
  );
}
