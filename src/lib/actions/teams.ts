"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const TeamSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["CUTTING", "CLIMBING", "PROCESSING"]),
  leader_name: z.string().min(2),
  phone: z.string().min(10),
  rate_per_unit: z.number().positive(),
  active: z.boolean().default(true),
});

export async function createTeam(data: z.infer<typeof TeamSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  const validated = TeamSchema.parse(data);

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "TEAM", team.id, { created: team });
  revalidatePath("/dashboard/teams");
  return team;
}

export async function updateTeam(id: string, data: Partial<z.infer<typeof TeamSchema>>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  
  const { data: team, error } = await supabase
    .from("teams")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "UPDATE", "TEAM", id, { updated: data });
  revalidatePath("/dashboard/teams");
  return team;
}
