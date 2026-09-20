// Shared pure utility functions for the Recycle Bin feature.
// This file intentionally has NO "use server" directive so it can be imported
// by both Server Actions (recycle_bin.ts) and API Route Handlers (route.ts)
// without triggering the "Server actions must be async" build error.

export type EntityClassification = "MASTER" | "OPERATIONAL" | "FINANCIAL";

export interface TrashItem {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  classification: EntityClassification;
  reason: string;
  deletedAt: string;
  scheduledDeleteAt: string;
  daysRemaining: number;
  hasDependencies: boolean;
  dependencySummary?: string;
  canPermanentlyDelete: boolean;
}

export function getClassification(entityType: string): EntityClassification {
  const t = entityType.toUpperCase();
  if (["FARM", "BUYER", "TEAM", "WORKER"].includes(t)) return "MASTER";
  if (["BILL", "PAYMENT", "EXPENSE"].includes(t)) return "FINANCIAL";
  return "OPERATIONAL";
}
