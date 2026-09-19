"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateFarm } from "@/lib/actions/farm";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditFarmPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farm, setFarm] = useState<any>(null);

  useEffect(() => {
    async function loadFarm() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Farm not found");
      } else {
        setFarm(data);
      }
      setFetching(false);
    }
    loadFarm();
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const treesVal = formData.get("total_trees");
    const yieldVal = formData.get("expected_yield");

    const data = {
      name: formData.get("name") as string,
      owner_name: formData.get("owner_name") as string,
      phone: formData.get("phone") as string,
      village: (formData.get("village") as string) || undefined,
      total_trees: treesVal ? Number(treesVal) : undefined,
      expected_yield: yieldVal ? Number(yieldVal) : undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      await updateFarm(params.id, data);
      router.push(`/dashboard/farms/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update farm");
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading farm details...</div>;
  }

  if (!farm) {
    return <div className="p-8 text-center text-xs text-rose-500">Farm could not be loaded.</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href={`/dashboard/farms/${params.id}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Edit Farm Grove
          </h1>
          <p className="text-xs text-slate-500">Update grove metadata and owner details</p>
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
            Farm / Grove Name *
          </label>
          <input
            required
            type="text"
            name="name"
            defaultValue={farm.name}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Farmer / Owner Name *
          </label>
          <input
            required
            type="text"
            name="owner_name"
            defaultValue={farm.owner_name}
            className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Phone Number *
            </label>
            <input
              required
              type="tel"
              name="phone"
              defaultValue={farm.phone}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Village / Location
            </label>
            <input
              type="text"
              name="village"
              defaultValue={farm.village || ""}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Trees
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="total_trees"
              defaultValue={farm.total_trees || ""}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Expected Yield / Cycle
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="expected_yield"
              defaultValue={farm.expected_yield || ""}
              className="w-full flex h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={farm.notes || ""}
            className="w-full flex min-h-[64px] rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-98 transition-all"
        >
          {loading ? "Updating..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
