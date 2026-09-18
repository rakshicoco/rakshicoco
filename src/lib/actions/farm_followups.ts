"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const FarmFollowUpSchema = z.object({
  farm_id: z.string().uuid(),
  date: z.string(),
  notes: z.string().min(5),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  next_follow_up: z.string().optional(),
});

export async function createFarmFollowUp(data: z.infer<typeof FarmFollowUpSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = FarmFollowUpSchema.parse(data);

  const { data: followup, error } = await supabase
    .from("farm_followups")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "FARM_FOLLOWUP", followup.id, { created: followup });
  revalidatePath("/dashboard/farms");
  revalidatePath(`/dashboard/farms/${validated.farm_id}`);
  return followup;
}

export async function completeFarmFollowUp(id: string, notes: string) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);

  const { error } = await supabase
    .from("farm_followups")
    .update({ status: "COMPLETED", notes })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "COMPLETE", "FARM_FOLLOWUP", id, { notes });
  revalidatePath("/dashboard/farms");
}
