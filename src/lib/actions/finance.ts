"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const PaymentSchema = z.object({
  entity_type: z.enum(["BUYER", "FARM", "TEAM", "WORKER", "VENDOR"]),
  entity_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string(),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["IN", "OUT"]),
});

export async function createPayment(data: z.infer<typeof PaymentSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  const validated = PaymentSchema.parse(data);

  // In production, use RPC to atomically update balances and insert payment
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "PAYMENT", payment.id, { created: payment });
  
  // Revalidate relevant paths based on entity
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/${validated.entity_type.toLowerCase()}s`);
  return payment;
}

const BillSchema = z.object({
  entity_type: z.enum(["FARM", "TEAM", "VENDOR"]),
  entity_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string(),
  due_date: z.string().optional(),
  description: z.string(),
});

export async function createBill(data: z.infer<typeof BillSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  const validated = BillSchema.parse(data);

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({ ...validated, status: "UNPAID", balance_due: validated.amount, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "BILL", bill.id, { created: bill });
  revalidatePath("/dashboard/bills");
  return bill;
}
