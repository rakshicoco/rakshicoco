"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const AppSettingsSchema = z.object({
  company_name: z.string().min(2),
  gstin: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  expected_harvest_interval_days: z.number().int().positive().default(40),
});

export async function updateAppSettings(data: z.infer<typeof AppSettingsSchema>) {
  const { supabase, user } = await requireRole(["ADMIN"]);
  const validated = AppSettingsSchema.parse(data);

  const { data: settings, error } = await supabase
    .from("app_settings")
    .upsert({ id: "DEFAULT", ...validated, updated_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "UPDATE", "SETTINGS", "DEFAULT", { updated: settings });
  revalidatePath("/dashboard/settings");
  return settings;
}
