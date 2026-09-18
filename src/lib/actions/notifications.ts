"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const NotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.string().default("INFO"),
  link: z.string().optional(),
});

export async function createNotification(data: z.infer<typeof NotificationSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER"]);
  const validated = NotificationSchema.parse(data);

  const { error } = await supabase
    .from("notifications")
    .insert({ ...validated, read: false, created_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  // We don't always need to audit internal notifications, but we can if we want to track them.
  revalidatePath("/dashboard");
}

export async function markNotificationRead(id: string) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR", "FINANCE", "SALES"]);
  
  // Ensure the user only marks their own notification
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
