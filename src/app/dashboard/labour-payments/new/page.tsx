"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPayment } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CreditCard, UsersRound, UserSquare } from "lucide-react";
import Link from "next/link";

export default function NewLabourPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<"TEAM" | "WORKER">("TEAM");
  const [entities, setEntities] = useState<SearchableOption[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  useEffect(() => {
    async function loadEntities() {
      const supabase = createClient();
      if (targetType === "TEAM") {
        const { data } = await supabase.from("teams").select("id, name, leader_name").order("name");
        setEntities(
          (data || []).map((t: any) => ({
            value: t.id,
            label: t.name,
            sublabel: t.leader_name ? `Mestri: ${t.leader_name}` : undefined,
            badge: "TEAM",
          }))
        );
      } else {
        const { data } = await supabase.from("workers").select("id, name, role, phone").order("name");
        setEntities(
          (data || []).map((w: any) => ({
            value: w.id,
            label: w.name,
            sublabel: w.role || w.phone,
            badge: "WORKER",
          }))
        );
      }
      setSelectedEntityId("");
    }
    loadEntities();
  }, [targetType]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const entity_id = formData.get("entity_id") as string;

    if (!entity_id) {
      setError(`Please select a ${targetType.toLowerCase()} to disburse wages.`);
      setLoading(false);
      return;
    }

    const data = {
      entity_type: targetType,
      entity_id,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
      payment_method: formData.get("payment_method") as "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE",
      reference: (formData.get("reference") as string) || undefined,
      notes: (formData.get("notes") as string) || "",
      type: "OUT" as const,
    };

    try {
      await createPayment(data);
      router.push("/dashboard/labour-payments");
    } catch (err: any) {
      setError(err.message || "Failed to record wage disbursement");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/labour-payments"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Disburse Wages
          </h1>
          <p className="text-xs text-slate-500">Record wage or team cutting payout</p>
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
            Payout Recipient Type *
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTargetType("TEAM")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                targetType === "TEAM"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500"
              }`}
            >
              <UsersRound size={14} /> Harvester Team
            </button>
            <button
              type="button"
              onClick={() => setTargetType("WORKER")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                targetType === "WORKER"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500"
              }`}
            >
              <UserSquare size={14} /> Individual Worker
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select {targetType === "TEAM" ? "Team" : "Worker"} *
          </label>
          <SearchableSelect
            name="entity_id"
            options={entities}
            value={selectedEntityId}
            onChange={setSelectedEntityId}
            placeholder={`Search ${targetType.toLowerCase()}...`}
            searchPlaceholder={`Search by name...`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Wage Amount (₹) *
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
              <option value="CASH">Cash Payout</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notes / Particulars
          </label>
          <textarea
            name="notes"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="e.g. Weekly cutting wage for Pollachi grove"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-purple-600 hover:bg-purple-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Recording Disbursement..." : "Disburse Wages"}
        </Button>
      </form>
    </div>
  );
}
