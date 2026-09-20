import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkEntityDependencies } from "@/lib/actions/recycle_bin";
import { getClassification } from "@/lib/recycle_bin_utils";

export const dynamic = "force-dynamic";

const TABLE_MAP: Record<string, string> = {
  FARM: "farms",
  BUYER: "buyers",
  TEAM: "teams",
  WORKER: "workers",
  PURCHASE: "purchases",
  CUTTING_BATCH: "cutting_batches",
  GROUPING_BATCH: "grouping_batches",
  TRANSPORT_TRIP: "transport_trips",
  DISPATCH: "dispatches",
  SALES_ORDER: "sales_orders",
  BILL: "bills",
  PAYMENT: "payments",
  EXPENSE: "expenses",
};

export async function POST(req: NextRequest) {
  // 1. Strict Server-Side Cron Authorization
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");

  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : cronHeader;

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret" },
      { status: 401 }
    );
  }

  // 2. Server-side cleanup only — never accept client payloads
  const admin = createAdminClient();
  const now = new Date();

  // Find trash actions older than 90 days
  const { data: trashLogs, error } = await admin
    .from("audit_logs")
    .select("audit_id, user_id, action, entity_type, entity_id, details, timestamp")
    .in("action", ["TRASH", "RESTORE", "PERMANENT_DELETE"])
    .order("timestamp", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reconcile current state
  const activeTrash = new Map<string, any>();
  for (const log of trashLogs || []) {
    const key = `${log.entity_type}:${log.entity_id}`;
    if (log.action === "TRASH") {
      activeTrash.set(key, log);
    } else if (log.action === "RESTORE" || log.action === "PERMANENT_DELETE") {
      activeTrash.delete(key);
    }
  }

  let deletedCount = 0;
  let archivedCount = 0;
  let skippedCount = 0;

  for (const [key, log] of activeTrash.entries()) {
    const details = log.details || {};
    const scheduledAt = details.scheduled_delete_at
      ? new Date(details.scheduled_delete_at)
      : new Date(new Date(log.timestamp).getTime() + 90 * 24 * 60 * 60 * 1000);

    // If not yet 90 days, skip
    if (scheduledAt > now) {
      skippedCount++;
      continue;
    }

    const classification = getClassification(log.entity_type);
    const table = TABLE_MAP[log.entity_type.toUpperCase()];

    if (!table) {
      skippedCount++;
      continue;
    }

    // Financial records are NEVER physically deleted
    if (classification === "FINANCIAL") {
      archivedCount++;
      continue;
    }

    // Check dependencies before permanent deletion
    const { hasDependencies } = await checkEntityDependencies(log.entity_type, log.entity_id);
    if (hasDependencies) {
      // Retain record, convert to ARCHIVED
      archivedCount++;
      await admin.from("audit_logs").insert({
        user_id: log.user_id,
        action: "ARCHIVE",
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: {
          converted_by: "CRON_CLEANUP_90_DAYS",
          reason: "90-day cleanup completed with active business dependencies; preserved as ARCHIVED",
          archived_at: now.toISOString(),
        },
      });
      continue;
    }

    // Zero dependencies: safe permanent deletion
    const { error: delErr } = await admin.from(table).delete().eq("id", log.entity_id);
    if (!delErr) {
      deletedCount++;
      await admin.from("audit_logs").insert({
        user_id: log.user_id,
        action: "PERMANENT_DELETE",
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: {
          deleted_by: "CRON_CLEANUP_90_DAYS",
          deleted_at: now.toISOString(),
        },
      });
    } else {
      skippedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    results: {
      deleted: deletedCount,
      archived: archivedCount,
      skipped: skippedCount,
    },
  });
}
