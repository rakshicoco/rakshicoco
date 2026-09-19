"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "DIESEL_PETROL",
  "VEHICLE_MAINTENANCE",
  "GODOWN_RENT",
  "ELECTRICITY_WATER",
  "PACKAGING_MATERIAL",
  "LABOUR_FOOD_WELFARE",
  "OFFICE_SUPPLIES",
  "MISCELLANEOUS",
];

export default function NewExpensePage() {
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
      category: formData.get("category") as string,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      payment_method: formData.get("payment_method") as "CASH" | "BANK_TRANSFER" | "UPI" | "CARD",
      reference: (formData.get("reference") as string) || undefined,
    };

    try {
      await createExpense(data);
      router.push("/dashboard/expenses");
    } catch (err: any) {
      setError(err.message || "Failed to record expense");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/expenses"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Record Expense
          </h1>
          <p className="text-xs text-slate-500">Log operational expense / overhead cost</p>
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
            Expense Category *
          </label>
          <select
            name="category"
            required
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Amount (₹) *
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
              Date *
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
              Payment Method *
            </label>
            <select
              name="payment_method"
              defaultValue="CASH"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Debit/Credit Card</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Description / Particulars *
          </label>
          <textarea
            required
            name="description"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="e.g. Godown diesel generator fuel"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Reference / Bill No (Optional)
          </label>
          <input
            type="text"
            name="reference"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Receipt / Voucher #"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-amber-600 hover:bg-amber-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Recording Expense..." : "Record Expense"}
        </Button>
      </form>
    </div>
  );
}
