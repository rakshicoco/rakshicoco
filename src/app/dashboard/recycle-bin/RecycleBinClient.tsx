"use client";

import { useState, useTransition } from "react";
import { TrashItem, restoreFromTrash, permanentDeleteSafe } from "@/lib/actions/recycle_bin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Trash2, AlertCircle, Clock, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  initialItems: TrashItem[];
}

export function RecycleBinClient({ initialItems }: Props) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [filter, setFilter] = useState<"ALL" | "MASTER" | "OPERATIONAL" | "FINANCIAL">("ALL");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const filtered = items.filter((item) => (filter === "ALL" ? true : item.classification === filter));

  const handleRestore = (item: TrashItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await restoreFromTrash(item.entityType, item.entityId);
        setItems((prev) => prev.filter((i) => !(i.entityType === item.entityType && i.entityId === item.entityId)));
        setFeedback({ type: "success", msg: res.message });
      } catch (err: any) {
        setFeedback({ type: "error", msg: err.message || "Failed to restore record" });
      }
    });
  };

  const handleDelete = (item: TrashItem) => {
    if (!item.canPermanentlyDelete) return;
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${item.title}? This cannot be undone.`)) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await permanentDeleteSafe(item.entityType, item.entityId);
        setItems((prev) => prev.filter((i) => !(i.entityType === item.entityType && i.entityId === item.entityId)));
        setFeedback({ type: "success", msg: res.message });
      } catch (err: any) {
        setFeedback({ type: "error", msg: err.message || "Failed to permanently delete record" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Tabs / Filter buttons */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {(["ALL", "MASTER", "OPERATIONAL", "FINANCIAL"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              filter === tab
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab} {tab === "ALL" ? `(${items.length})` : `(${items.filter((i) => i.classification === tab).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Recycle bin is empty"
          description="Deleted items across master, operational, and financial modules will appear here for safe 90-day retention."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={`${item.entityType}-${item.entityId}`} className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.classification === "MASTER"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : item.classification === "OPERATIONAL"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {item.classification}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {item.daysRemaining} days left
                    </span>
                  </div>
                </div>

                {item.hasDependencies ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Protected from permanent deletion:</span>{" "}
                      {item.dependencySummary}
                    </div>
                  </div>
                ) : item.classification === "FINANCIAL" ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Permanent business traceability retained for tax/audit compliance.</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                    <span>Zero dependencies. Eligible for permanent cleanup after 90 days.</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">
                    Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(item)}
                      disabled={isPending}
                      className="h-8 text-xs font-semibold"
                    >
                      <RotateCcw size={12} className="mr-1.5" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      disabled={isPending || !item.canPermanentlyDelete}
                      title={
                        !item.canPermanentlyDelete
                          ? item.hasDependencies
                            ? "Blocked by active dependencies"
                            : "Financial records cannot be permanently destroyed"
                          : "Permanently delete"
                      }
                      className="h-8 text-xs font-semibold disabled:opacity-40"
                    >
                      <Trash2 size={12} className="mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
