"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UsersRound } from "lucide-react";
import Link from "next/link";

export default function NewTeamPage() {
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
      name: formData.get("name") as string,
      type: formData.get("type") as "CUTTING" | "CLIMBING" | "PROCESSING",
      leader_name: formData.get("leader_name") as string,
      phone: formData.get("phone") as string,
      rate_per_unit: Number(formData.get("rate_per_unit")),
      active: true,
    };

    try {
      const team = await createTeam(data);
      router.push(`/dashboard/teams/${team.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create team");
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/teams"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Harvester Team
          </h1>
          <p className="text-xs text-slate-500">Register cutting, climbing, or dehusking crew</p>
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
            Team Name *
          </label>
          <input
            required
            type="text"
            name="name"
            placeholder="e.g. Pollachi Harvesters"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Team Specialization *
          </label>
          <select
            name="type"
            defaultValue="CUTTING"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="CUTTING">Cutting & Harvest</option>
            <option value="CLIMBING">Tree Climbing</option>
            <option value="PROCESSING">Dehusking & Sorting</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Leader / Mestri Name *
          </label>
          <input
            required
            type="text"
            name="leader_name"
            placeholder="Crew leader name"
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Leader Phone *
            </label>
            <input
              required
              type="tel"
              name="phone"
              placeholder="10-digit mobile"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rate / Nut (₹) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              inputMode="decimal"
              name="rate_per_unit"
              placeholder="1.50"
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Registering Team..." : "Register Team"}
        </Button>
      </form>
    </div>
  );
}
