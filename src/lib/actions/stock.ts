"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const StockMovementSchema = z.object({
  godown_id: z.string().uuid(),
  product_type: z.string().default("COCONUT"),
  qty: z.number().int().positive(),
  from_state: z.string().optional(),
  to_state: z.enum(["RAW", "PROCESSING", "READY", "RESERVED", "DISPATCHED", "WASTAGE"]),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function createStockMovement(data: z.infer<typeof StockMovementSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = StockMovementSchema.parse(data);

  // In production this must be atomic using RPC
  const { data: movement, error } = await supabase
    .from("stock_movements")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "MOVEMENT", "STOCK", movement.id, { movement });
  revalidatePath("/dashboard/stock");
  return movement;
}
