"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPayment } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, HandCoins, Building2, Trees } from "lucide-react";
import Link from "next/link";

function FarmPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFarmId = searchParams.get("farm_id") || "";
  const initialPurchaseId = searchParams.get("purchase_id") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<SearchableOption[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId);

  useEffect(() => {
    async function loadFarms() {
      const supabase = createClient();
      const { data } = await supabase
        .from("farms")
        .select("id, name, village, owner_name")
        .eq("active", true)
        .order("name");

      if (data) {
        setFarms(
          data.map((f: any) => ({
            value: f.id,
            label: f.name,
            sublabel: f.village ? `Village: ${f.village}` : undefined,
            badge: `ID: ${f.id}`,
          }))
        );
      }
    }
    loadFarms();
  }, []);

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
      entity_type: "FARM" as const,
      entity_id: farm_id,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
      payment_method: formData.get("payment_method") as "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE",
      reference: (formData.get("reference") as string) || (initialPurchaseId ? `Purchase: ${initialPurchaseId}` : undefined),
      notes: (formData.get("notes") as string) || "",
      type: "OUT" as const,
    };

    try {
      await createPayment(data);
      router.push("/dashboard/farm-payments");
    } catch (err: any) {
      setError(err.message || "Failed to record farm payment");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/farm-payments"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Record Farm Payment
          </h1>
          <p className="text-xs text-slate-500">Disburse coconut harvest payout to farmer</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {initialPurchaseId && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 font-semibold">
            Settling Purchase Order: <span className="font-mono">{initialPurchaseId}</span>
          </div>
        )}

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

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Disbursement Amount (₹) *
          </label>
          <input
            required
            type="number"
            step="0.01"
            inputMode="decimal"
            name="amount"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Payment Date *
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
              Payment Mode *
            </label>
            <select
              name="payment_method"
              defaultValue="BANK_TRANSFER"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Transaction Reference / UTR
          </label>
          <input
            type="text"
            name="reference"
            defaultValue={initialPurchaseId ? `PO: ${initialPurchaseId}` : ""}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="e.g. UTR / Cheque #"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Payment remarks or harvest settlement details..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-amber-600 hover:bg-amber-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Recording Payment..." : "Record Farm Payment"}
        </Button>
      </form>
    </div>
  );
}

export default function NewFarmPaymentPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm text-slate-500">Loading form...</div>}>
      <FarmPaymentForm />
    </Suspense>
  );
}
