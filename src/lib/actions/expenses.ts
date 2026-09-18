"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const ExpenseSchema = z.object({
  category: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  description: z.string(),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CARD"]),
  reference: z.string().optional(),
});

export async function createExpense(data: z.infer<typeof ExpenseSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  const validated = ExpenseSchema.parse(data);

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "EXPENSE", expense.id, { created: expense });
  revalidatePath("/dashboard/expenses");
  return expense;
}
