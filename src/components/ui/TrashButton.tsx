"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { moveToTrash } from "@/lib/actions/recycle_bin";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TrashButtonProps {
  entityType: string;
  entityId: string;
  label?: string;
  redirectHref?: string;
  className?: string;
}

export function TrashButton({ entityType, entityId, label, redirectHref, className }: TrashButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleTrash() {
    if (pending) return;
    const confirmed = window.confirm(
      `Move this ${entityType.toLowerCase().replace("_", " ")} to Recycle Bin?\n\nIt will be hidden from all lists but can be restored within 90 days.`
    );
    if (!confirmed) return;

    setPending(true);
    setError(null);
    try {
      await moveToTrash(entityType, entityId, "Manually moved to Recycle Bin");
      if (redirectHref) {
        router.push(redirectHref);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || "Failed to move to trash");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleTrash}
        disabled={pending}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all min-h-[40px] touch-manipulation",
          className
        )}
        title="Move to Recycle Bin"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        <span>{label || "Move to Trash"}</span>
      </button>
      {error && (
        <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
