import { getTrashItems } from "@/lib/actions/recycle_bin";
import { RecycleBinClient } from "./RecycleBinClient";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecycleBinPage() {
  const items = await getTrashItems();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trash2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Recycle Bin
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              90-day dependency-safe retention for Master, Operational, and Financial records.
            </p>
          </div>
        </div>
      </div>

      <RecycleBinClient initialItems={items} />
    </div>
  );
}
