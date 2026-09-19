import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UsersRound, Phone, User, CheckCircle2 } from "lucide-react";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      *,
      workers (id, name, phone, role, daily_wage, active)
    `)
    .eq("id", params.id)
    .single();

  if (error || !team) {
    notFound();
  }

  const workers = (team.workers as any[]) || [];

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{team.name}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              team.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {team.active ? "Active" : "Archived"}
            </span>
          </h1>
          <p className="text-xs text-slate-500">{team.type || "Harvester"} Team</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block mb-0.5">Leader / Mestri</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {team.leader_name || "Unspecified"}
            </span>
            {team.phone && (
              <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone size={11} /> {team.phone}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Standard Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{Number(team.rate_per_unit || 0).toFixed(2)} / nut
            </span>
          </div>
        </div>
      </div>

      {/* Workers in Team */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Crew Members ({workers.length})
          </h3>
          <Link
            href="/dashboard/workers/new"
            className="text-xs font-semibold text-primary hover:underline"
          >
            + Add Worker
          </Link>
        </div>

        {workers.length === 0 ? (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No workers assigned to this team yet.
          </div>
        ) : (
          workers.map((w: any) => (
            <div
              key={w.id}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{w.name}</span>
                <span className="text-slate-500 block">{w.role || "Harvester"} • {w.phone || "No phone"}</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ₹{Number(w.daily_wage || 0)} / day
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
