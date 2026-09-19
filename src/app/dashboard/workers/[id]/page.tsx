import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserSquare, Phone, UsersRound, Calendar } from "lucide-react";

export default async function WorkerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: worker, error } = await supabase
    .from("workers")
    .select(`
      *,
      teams:team_id (id, name)
    `)
    .eq("id", params.id)
    .single();

  if (error || !worker) {
    notFound();
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{worker.name}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              worker.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {worker.active ? "Active" : "Inactive"}
            </span>
          </h1>
          <p className="text-xs text-slate-500">{worker.role || "Worker"} Record</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block mb-0.5">Assigned Team</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {worker.teams?.name || "Independent"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              {worker.phone || "No phone"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Daily Wage Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{Number(worker.daily_wage || 0).toLocaleString()} / day
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Registered Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {worker.created_at ? new Date(worker.created_at).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
