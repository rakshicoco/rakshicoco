"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const WorkerSchema = z.object({
  name: z.string().min(2),
  team_id: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  daily_wage: z.number().positive().optional(),
  active: z.boolean().default(true),
});

export async function createWorker(data: z.infer<typeof WorkerSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  const validated = WorkerSchema.parse(data);

  const { data: worker, error } = await supabase
    .from("workers")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "WORKER", worker.id, { created: worker });
  revalidatePath("/dashboard/workers");
  return worker;
}

export async function updateWorker(id: string, data: Partial<z.infer<typeof WorkerSchema>>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  
  const { data: worker, error } = await supabase
    .from("workers")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "UPDATE", "WORKER", id, { updated: data });
  revalidatePath("/dashboard/workers");
  return worker;
}
