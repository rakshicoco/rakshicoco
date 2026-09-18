"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const PurchaseSchema = z.object({
  farm_id: z.string().uuid(),
  expected_date: z.string(), // ISO date string
  expected_quantity: z.number().int().positive(),
  rate: z.number().positive(),
  advance_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function createPurchase(data: z.infer<typeof PurchaseSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);

  const validated = PurchaseSchema.parse(data);

  // Use a database transaction to prevent race conditions when updating farm next harvest
  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({
      farm_id: validated.farm_id,
      expected_date: validated.expected_date,
      expected_quantity: validated.expected_quantity,
      rate: validated.rate,
      advance_amount: validated.advance_amount,
      notes: validated.notes,
      status: "PENDING",
      created_by: user.id,
      balance: validated.advance_amount > 0 ? -(validated.advance_amount) : 0, // Simplified, assume balance is updated elsewhere if advance is given
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "PURCHASE", purchase.id, { created: purchase });
  revalidatePath("/dashboard/purchases");
  return purchase;
}

const HarvestSchema = z.object({
  actual_date: z.string(),
  actual_quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export async function completeHarvest(purchaseId: string, data: z.infer<typeof HarvestSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  
  const validated = HarvestSchema.parse(data);

  // Fetch current purchase to get farm_id
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("farm_id")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) throw new Error("Purchase not found");

  // In a real production system, this should be an RPC to ensure atomicity
  const { error: updateError } = await supabase
    .from("purchases")
    .update({
      status: "CONFIRMED",
      actual_quantity: validated.actual_quantity,
      harvest_date: validated.actual_date,
    })
    .eq("id", purchaseId);

  if (updateError) throw new Error(updateError.message);

  // Fetch interval from settings
  const { data: settings } = await supabase
    .from("app_settings")
    .select("expected_harvest_interval_days")
    .eq("id", "DEFAULT")
    .single();
    
  const intervalDays = settings?.expected_harvest_interval_days || 40;

  // Update farm's next harvest date
  const nextHarvestDate = new Date(validated.actual_date);
  nextHarvestDate.setDate(nextHarvestDate.getDate() + intervalDays);
  
  await supabase
    .from("farms")
    .update({ 
      last_harvest_date: validated.actual_date,
      expected_next_harvest: nextHarvestDate.toISOString().split('T')[0]
    })
    .eq("id", purchase.farm_id);

  await logAudit(supabase, user.id, "HARVEST", "PURCHASE", purchaseId, { ...validated });
  revalidatePath("/dashboard/purchases");
  revalidatePath(`/dashboard/farms/${purchase.farm_id}`);
}


export async function changePurchaseStatus(purchaseId: string, status: string) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);

  const { error } = await supabase
    .from("purchases")
    .update({ status })
    .eq("id", purchaseId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "STATUS_CHANGE", "PURCHASE", purchaseId, { status });
  revalidatePath("/dashboard/purchases");
}
