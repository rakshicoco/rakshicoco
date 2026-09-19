"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDispatch } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";

export default function NewDispatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SearchableOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("sales_orders")
        .select("id, quantity, product_type, buyers(name)")
        .order("created_at", { ascending: false });

      if (data) {
        setSalesOrders(
          data.map((so: any) => ({
            value: so.id,
            label: `${so.id} — ${(so.buyers as any)?.name || "Buyer"}`,
            sublabel: `${Number(so.quantity || 0).toLocaleString()} nuts (${so.product_type || "COCONUT"})`,
            badge: "SO",
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
    const sales_order_id = formData.get("sales_order_id") as string;

    if (!sales_order_id) {
      setError("Please select a sales order.");
      setLoading(false);
      return;
    }

    const data = {
      sales_order_id,
      date: formData.get("date") as string,
      vehicle_number: formData.get("vehicle_number") as string,
      driver_name: (formData.get("driver_name") as string) || undefined,
      driver_phone: (formData.get("driver_phone") as string) || undefined,
      loaded_quantity: Number(formData.get("loaded_quantity")),
    };

    try {
      const disp = await createDispatch(data);
      router.push(`/dashboard/dispatch/${disp.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create dispatch");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/dispatch"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Dispatch
          </h1>
          <p className="text-xs text-slate-500">Dispatch coconut order shipment to buyer</p>
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
            Select Sales Order *
          </label>
          <SearchableSelect
            name="sales_order_id"
            options={salesOrders}
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            placeholder="Search sales order..."
            searchPlaceholder="Search SO or buyer..."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Dispatch Date *
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
            Vehicle Number *
          </label>
          <input
            required
            type="text"
            name="vehicle_number"
            placeholder="e.g. TN 38 AB 1234"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Driver Name
            </label>
            <input
              type="text"
              name="driver_name"
              placeholder="Driver name"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Driver Phone
            </label>
            <input
              type="tel"
              name="driver_phone"
              placeholder="10-digit mobile"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Loaded Quantity (Nuts) *
          </label>
          <input
            required
            type="number"
            inputMode="numeric"
            name="loaded_quantity"
            placeholder="0"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Dispatching..." : "Confirm & Dispatch"}
        </Button>
      </form>
    </div>
  );
}
