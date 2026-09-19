"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const CuttingBatchSchema = z.object({
  purchase_id: z.string().min(1),
  team_id: z.string().min(1),
  date: z.string(),
  expected_output_nuts: z.number().int().positive(),
  rate_per_nut: z.number().positive(),
});

export async function createCuttingBatch(data: z.infer<typeof CuttingBatchSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = CuttingBatchSchema.parse(data);

  // In production, use RPC. For now, simple insert
  const { data: batch, error } = await supabase
    .from("cutting_batches")
    .insert({
      ...validated,
      status: "IN_PROGRESS",
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("purchases").update({ status: "CUTTING" }).eq("id", validated.purchase_id);
  
  await logAudit(supabase, user.id, "CREATE", "CUTTING", batch.id, { created: batch });
  revalidatePath("/dashboard/cutting");
  revalidatePath(`/dashboard/purchases/${validated.purchase_id}`);
  return batch;
}

const CompleteCuttingSchema = z.object({
  actual_output_nuts: z.number().int().positive(),
  rejection_count: z.number().int().min(0).default(0),
});

export async function completeCuttingBatch(batchId: string, data: z.infer<typeof CompleteCuttingSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = CompleteCuttingSchema.parse(data);

  const { error } = await supabase
    .from("cutting_batches")
    .update({
      ...validated,
      status: "COMPLETED",
    })
    .eq("id", batchId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "COMPLETE", "CUTTING", batchId, { ...validated });
  revalidatePath("/dashboard/cutting");
}

const GroupingBatchSchema = z.object({
  cutting_batch_ids: z.array(z.string().min(1)).min(1),
  date: z.string(),
  destination_godown: z.string(),
});

export async function createGroupingBatch(data: z.infer<typeof GroupingBatchSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = GroupingBatchSchema.parse(data);

  const { data: group, error } = await supabase
    .from("grouping_batches")
    .insert({
      date: validated.date,
      destination_godown: validated.destination_godown,
      status: "PENDING_TRANSPORT",
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mark cutting batches as grouped
  await supabase
    .from("cutting_batches")
    .update({ grouping_batch_id: group.id, status: "GROUPED" })
    .in("id", validated.cutting_batch_ids);

  await logAudit(supabase, user.id, "CREATE", "GROUPING", group.id, { created: group, linked_cutting: validated.cutting_batch_ids });
  revalidatePath("/dashboard/grouping");
  return group;
}

const ProcessingBatchSchema = z.object({
  purchase_id: z.string().min(1).optional(),
  team_id: z.string().min(1).optional(),
  qty_given: z.number().min(0),
  rate: z.number().min(0),
  date: z.string(),
  notes: z.string().optional(),
});

export async function createProcessingBatch(data: z.infer<typeof ProcessingBatchSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = ProcessingBatchSchema.parse(data);

  const labour_amount = Number(validated.qty_given || 0) * Number(validated.rate || 0);

  const { data: batch, error } = await supabase
    .from("processing_batches")
    .insert({
      ...validated,
      labour_amount,
      balance: labour_amount,
      status: "PENDING",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "PROCESSING", batch.id, { created: batch });
  revalidatePath("/dashboard/processing");
  return batch;
}
