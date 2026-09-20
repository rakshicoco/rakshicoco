"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorker } from "@/lib/actions/workers";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/SearchableSelect";
import { getTeamsForSelect } from "@/lib/actions/select_options";
import { ArrowLeft, UserSquare } from "lucide-react";
import Link from "next/link";

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<SearchableOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function loadTeams() {
      const data = await getTeamsForSelect();
      if (active) {
        setTeams(data);
      }
    }
    loadTeams();
    return () => { active = false; };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const wageVal = formData.get("daily_wage");
    const data = {
      name: formData.get("name") as string,
      team_id: selectedTeamId || undefined,
      phone: (formData.get("phone") as string) || undefined,
      role: (formData.get("role") as string) || "Harvester",
      daily_wage: wageVal ? Number(wageVal) : undefined,
      active: true,
    };

    try {
      const worker = await createWorker(data);
      router.push(`/dashboard/workers/${worker.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create worker");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/workers"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Add Worker
          </h1>
          <p className="text-xs text-slate-500">Register field worker or harvester</p>
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
            Worker Full Name *
          </label>
          <input
            required
            type="text"
            name="name"
            placeholder="e.g. Murugan S"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Assigned Team (Optional)
          </label>
          <SearchableSelect
            name="team_id"
            options={teams}
            value={selectedTeamId}
            onChange={setSelectedTeamId}
            placeholder="Select team..."
            searchPlaceholder="Search team..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit phone"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daily Wage (₹)
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              name="daily_wage"
              placeholder="e.g. 750"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Role / Task
          </label>
          <select
            name="role"
            defaultValue="Harvester"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="Harvester">Harvester / Cutter</option>
            <option value="Climber">Tree Climber</option>
            <option value="Driver">Vehicle Driver</option>
            <option value="Loader">Loading / Unloading</option>
            <option value="Dehusker">Dehusker / Peeler</option>
            <option value="Helper">General Helper</option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Registering..." : "Add Worker"}
        </Button>
      </form>
    </div>
  );
}
