"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSalesOrder } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getBuyersForSelect, type ExtendedBuyerOption } from "@/lib/actions/select_options";
import { Building2, Phone, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<ExtendedBuyerOption[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      const data = await getBuyersForSelect();
      if (active) {
        setBuyers(data);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const selectedBuyer = buyers.find((b) => b.value === selectedBuyerId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const buyer_id = formData.get("buyer_id") as string;

    if (!buyer_id) {
      setError("Please select a buyer.");
      setLoading(false);
      return;
    }

    const data = {
      buyer_id,
      date: formData.get("date") as string,
      product_type: formData.get("product_type") as string,
      quantity: Number(formData.get("quantity")),
      rate: Number(formData.get("rate")),
      delivery_address: (formData.get("delivery_address") as string) || "",
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
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/sales"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Sales Order
          </h1>
          <p className="text-xs text-slate-500">Record a new coconut order for a buyer</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Searchable Buyer Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Buyer *
          </label>
          <SearchableSelect
            name="buyer_id"
            options={buyers}
            value={selectedBuyerId}
            onChange={setSelectedBuyerId}
            placeholder="Search buyer by name, phone, or ID..."
            searchPlaceholder="Search by name, phone, or ID..."
            required
          />
        </div>

        {/* Selected Buyer Details Card */}
        {selectedBuyer && (
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 rounded-xl text-xs space-y-1 animate-in fade-in duration-150">
            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Building2 size={14} />
              {selectedBuyer.label}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
              {selectedBuyer.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-blue-600" />
                  {selectedBuyer.phone}
                </span>
              )}
              {selectedBuyer.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="text-blue-600 shrink-0" />
                  <span className="truncate">{selectedBuyer.address}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Order Date *
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
              Quantity (Units) *
            </label>
            <input
              required
              type="number"
              inputMode="numeric"
              name="quantity"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rate (₹) *
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
            Product Type
          </label>
          <select
            name="product_type"
            defaultValue="COCONUT"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="COCONUT">Raw Coconut</option>
            <option value="DEHUSKED">Dehusked Coconut</option>
            <option value="COPRA">Copra</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Delivery Destination
          </label>
          <textarea
            name="delivery_address"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Delivery destination / address..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-green-600 hover:bg-green-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Confirming Order..." : "Confirm Sales Order"}
        </Button>
      </form>
    </div>
  );
}
