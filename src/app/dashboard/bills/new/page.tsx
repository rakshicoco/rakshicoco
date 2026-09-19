"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBill } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Calendar, IndianRupee } from "lucide-react";
import Link from "next/link";

export default function NewBillPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<"BUYER" | "FARM" | "TEAM" | "VENDOR">("BUYER");
  const [entities, setEntities] = useState<SearchableOption[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  useEffect(() => {
    async function loadEntities() {
      const supabase = createClient();
      let options: SearchableOption[] = [];

      if (entityType === "BUYER") {
        const { data } = await supabase.from("buyers").select("id, name, phone, address").order("name");
        options = (data || []).map((b: any) => ({
          value: b.id,
          label: b.name,
          sublabel: b.phone ? `Ph: ${b.phone}` : b.address,
          badge: `BUYER`
        }));
      } else if (entityType === "FARM") {
        const { data } = await supabase.from("farms").select("id, name, village").eq("active", true).order("name");
        options = (data || []).map((f: any) => ({
          value: f.id,
          label: f.name,
          sublabel: f.village ? `Village: ${f.village}` : undefined,
          badge: `FARM`
        }));
      } else if (entityType === "TEAM") {
        const { data } = await supabase.from("teams").select("id, name").order("name");
        options = (data || []).map((t: any) => ({
          value: t.id,
          label: t.name,
          badge: `TEAM`
        }));
      } else {
        options = [
          { value: "VENDOR-GENERAL", label: "General Operational Vendor", badge: "VENDOR" },
          { value: "VENDOR-DIESEL", label: "Diesel / Fuel Station", badge: "VENDOR" },
          { value: "VENDOR-PACKAGING", label: "Packaging Supplies", badge: "VENDOR" }
        ];
      }

      setEntities(options);
      setSelectedEntityId("");
    }

    loadEntities();
  }, [entityType]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const entity_id = formData.get("entity_id") as string;

    if (!entity_id) {
      setError("Please select the party / entity for this bill.");
      setLoading(false);
      return;
    }

    const data = {
      entity_type: entityType,
      entity_id,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
      due_date: (formData.get("due_date") as string) || undefined,
      description: formData.get("description") as string,
    };

    try {
      await createBill(data);
      router.push("/dashboard/bills");
    } catch (err: any) {
      setError(err.message || "Failed to create bill");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/bills"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Bill / Invoice
          </h1>
          <p className="text-xs text-slate-500">Generate a customer invoice or vendor bill</p>
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
            Bill Entity Type *
          </label>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(["BUYER", "FARM", "TEAM", "VENDOR"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntityType(type)}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  entityType === type
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select {entityType} *
          </label>
          <SearchableSelect
            name="entity_id"
            options={entities}
            value={selectedEntityId}
            onChange={setSelectedEntityId}
            placeholder={`Search ${entityType.toLowerCase()}...`}
            searchPlaceholder={`Search by name...`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Bill Amount (₹) *
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
              Issue Date *
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
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              defaultValue={new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Description / Item Particulars *
          </label>
          <textarea
            required
            name="description"
            rows={2}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="e.g. Invoice for 500 nuts dispatched to buyer"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Generating Bill..." : "Create Bill"}
        </Button>
      </form>
    </div>
  );
}
