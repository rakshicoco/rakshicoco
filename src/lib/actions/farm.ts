"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const FarmSchema = z.object({
  name: z.string().min(2, "Name is required"),
  owner_name: z.string().min(2, "Owner name is required"),
  phone: z.string().min(10, "Phone number is required"),
  village: z.string().optional(),
  total_trees: z.number().int().positive().optional(),
  expected_yield: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function createFarm(data: z.infer<typeof FarmSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);

  const validated = FarmSchema.parse(data);

  const { data: farm, error } = await supabase
    .from("farms")
    .insert({
      ...validated,
      active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "FARM", farm.id, { created: farm });
  revalidatePath("/dashboard/farms");
  return farm;
}

export async function updateFarm(id: string, data: Partial<z.infer<typeof FarmSchema>>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  
  const { data: farm, error } = await supabase
    .from("farms")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "UPDATE", "FARM", id, { updated: data });
  revalidatePath("/dashboard/farms");
  revalidatePath(`/dashboard/farms/${id}`);
  return farm;
}

export async function archiveFarm(id: string) {
  const { supabase, user } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("farms")
    .update({ active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "ARCHIVE", "FARM", id, {});
  revalidatePath("/dashboard/farms");
}
