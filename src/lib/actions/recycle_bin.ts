"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "./utils";
import { getClassification, TrashItem } from "@/lib/recycle_bin_utils";
export type { EntityClassification } from "@/lib/recycle_bin_utils";
export type { TrashItem } from "@/lib/recycle_bin_utils";


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


export async function checkEntityDependencies(entityType: string, entityId: string) {
  const admin = createAdminClient();
  const t = entityType.toUpperCase();
  const dependencies: string[] = [];

  if (t === "FARM") {
    const { count } = await admin.from("purchases").select("id", { count: "exact", head: true }).eq("farm_id", entityId);
    if (count && count > 0) dependencies.push(`${count} procurement purchase orders`);
  } else if (t === "BUYER") {
    const [{ count: soCount }, { count: billCount }] = await Promise.all([
      admin.from("sales_orders").select("id", { count: "exact", head: true }).eq("buyer_id", entityId),
      admin.from("bills").select("id", { count: "exact", head: true }).eq("entity_id", entityId),
    ]);
    if (soCount && soCount > 0) dependencies.push(`${soCount} sales orders`);
    if (billCount && billCount > 0) dependencies.push(`${billCount} commercial bills`);
  } else if (t === "TEAM") {
    const { count } = await admin.from("cutting_batches").select("id", { count: "exact", head: true }).eq("team_id", entityId);
    if (count && count > 0) dependencies.push(`${count} cutting batches`);
  } else if (t === "PURCHASE") {
    const { count } = await admin.from("cutting_batches").select("id", { count: "exact", head: true }).eq("purchase_id", entityId);
    if (count && count > 0) dependencies.push(`${count} cutting harvest batches`);
  } else if (t === "SALES_ORDER") {
    const { count } = await admin.from("dispatches").select("id", { count: "exact", head: true }).eq("sales_order_id", entityId);
    if (count && count > 0) dependencies.push(`${count} dispatch records`);
  } else if (["BILL", "PAYMENT", "EXPENSE"].includes(t)) {
    dependencies.push("Financial & tax audit traceability record");
  }

  return {
    hasDependencies: dependencies.length > 0,
    dependencies,
    summary: dependencies.join(", "),
  };
}

export async function moveToTrash(entityType: string, entityId: string, reason: string) {
  const { user } = await requireAuth();
  const admin = createAdminClient();
  const classification = getClassification(entityType);
  const table = TABLE_MAP[entityType.toUpperCase()];

  if (!table) throw new Error(`Unknown entity type: ${entityType}`);

  // Operational records check
  if (classification === "OPERATIONAL") {
    const { hasDependencies, summary } = await checkEntityDependencies(entityType, entityId);
    if (hasDependencies) {
      throw new Error(`Cannot trash operational record with active downstream dependencies: ${summary}`);
    }
  }

  // Update operational status
  if (classification === "FINANCIAL") {
    if (table === "bills") {
      await admin.from("bills").update({ status: "VOIDED" }).eq("id", entityId);
    }
  } else if (table === "farms") {
    await admin.from("farms").update({ active: false }).eq("id", entityId);
  } else if (["purchases", "sales_orders", "cutting_batches", "transport_trips", "dispatches"].includes(table)) {
    await admin.from(table).update({ status: "CANCELLED" }).eq("id", entityId);
  }

  const now = new Date();
  const scheduledDelete = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Write to audit log
  await admin.from("audit_logs").insert({
    user_id: user.id,
    action: "TRASH",
    entity_type: entityType.toUpperCase(),
    entity_id: entityId,
    details: {
      reason: reason || "Moved to Recycle Bin",
      classification,
      deleted_at: now.toISOString(),
      scheduled_delete_at: scheduledDelete.toISOString(),
      deleted_by: user.id,
    },
  });

  return {
    success: true,
    message: `${entityType} moved to Recycle Bin (90-day retention).`,
  };
}

export async function restoreFromTrash(entityType: string, entityId: string) {
  const { user } = await requireAuth();
  const admin = createAdminClient();
  const table = TABLE_MAP[entityType.toUpperCase()];

  if (!table) throw new Error(`Unknown entity type: ${entityType}`);

  if (table === "farms") {
    await admin.from("farms").update({ active: true }).eq("id", entityId);
  } else if (table === "bills") {
    await admin.from("bills").update({ status: "Draft" }).eq("id", entityId);
  } else if (["purchases", "sales_orders", "cutting_batches", "transport_trips", "dispatches"].includes(table)) {
    await admin.from(table).update({ status: "PENDING" }).eq("id", entityId);
  }

  await admin.from("audit_logs").insert({
    user_id: user.id,
    action: "RESTORE",
    entity_type: entityType.toUpperCase(),
    entity_id: entityId,
    details: {
      restored_at: new Date().toISOString(),
      restored_by: user.id,
    },
  });

  return {
    success: true,
    message: `${entityType} successfully restored.`,
  };
}

export async function permanentDeleteSafe(entityType: string, entityId: string) {
  const { user } = await requireRole(["ADMIN", "OWNER"]);
  const admin = createAdminClient();
  const classification = getClassification(entityType);
  const table = TABLE_MAP[entityType.toUpperCase()];

  if (!table) throw new Error(`Unknown entity type: ${entityType}`);

  // 1. FINANCIAL records can NEVER be permanently deleted
  if (classification === "FINANCIAL") {
    throw new Error(
      "Financial and accounting records cannot be permanently destroyed. They must be retained for audit traceability."
    );
  }

  // 2. Strict dependency check
  const { hasDependencies, summary } = await checkEntityDependencies(entityType, entityId);
  if (hasDependencies) {
    throw new Error(
      `Cannot permanently delete: record has active business dependencies (${summary}). Retain record as ARCHIVED.`
    );
  }

  // 3. Execute deletion
  const { error } = await admin.from(table).delete().eq("id", entityId);
  if (error) {
    throw new Error(`Deletion failed: ${error.message}`);
  }

  // 4. Record audit event
  await admin.from("audit_logs").insert({
    user_id: user.id,
    action: "PERMANENT_DELETE",
    entity_type: entityType.toUpperCase(),
    entity_id: entityId,
    details: {
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    },
  });

  return {
    success: true,
    message: `Record ${entityId} permanently removed.`,
  };
}

export async function getTrashItems(): Promise<TrashItem[]> {
  await requireAuth();
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_logs")
    .select("audit_id, user_id, action, entity_type, entity_id, details, timestamp")
    .in("action", ["TRASH", "RESTORE", "PERMANENT_DELETE"])
    .order("timestamp", { ascending: true });

  if (!logs || logs.length === 0) return [];

  // Reconcile current state per entity
  const entityStates = new Map<string, any>();

  for (const log of logs) {
    const key = `${log.entity_type}:${log.entity_id}`;
    if (log.action === "TRASH") {
      entityStates.set(key, log);
    } else if (log.action === "RESTORE" || log.action === "PERMANENT_DELETE") {
      entityStates.delete(key);
    }
  }

  const items: TrashItem[] = [];
  const now = Date.now();

  for (const [key, log] of entityStates.entries()) {
    const details = log.details || {};
    const scheduledAt = details.scheduled_delete_at
      ? new Date(details.scheduled_delete_at).getTime()
      : new Date(log.timestamp).getTime() + 90 * 24 * 60 * 60 * 1000;

    const diffDays = Math.max(0, Math.ceil((scheduledAt - now) / (1000 * 60 * 60 * 24)));
    const classification = getClassification(log.entity_type);
    const depCheck = await checkEntityDependencies(log.entity_type, log.entity_id);

    items.push({
      id: log.audit_id,
      entityType: log.entity_type,
      entityId: log.entity_id,
      title: `${log.entity_type} #${log.entity_id}`,
      classification,
      reason: details.reason || "Manual deletion",
      deletedAt: details.deleted_at || log.timestamp,
      scheduledDeleteAt: new Date(scheduledAt).toISOString(),
      daysRemaining: diffDays,
      hasDependencies: depCheck.hasDependencies,
      dependencySummary: depCheck.summary,
      canPermanentlyDelete: classification !== "FINANCIAL" && !depCheck.hasDependencies,
    });
  }

  return items;
}
